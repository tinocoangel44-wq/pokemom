-- =====================================================================
-- ESQUEMA SQL MAESTRO: VIDEOJUEGO DE CARTAS POKÉMON (GEN 9)
-- =====================================================================
-- Este script define la estructura de tablas, restricciones, índices,
-- triggers avanzados de integridad y estadísticas, así como políticas de
-- seguridad de fila (RLS) para el backend del juego en Supabase.
-- =====================================================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================================
-- 1. TABLA: profiles
-- =====================================================================
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL CHECK (char_length(username) >= 3),
    avatar_url TEXT,
    total_wins INTEGER NOT NULL DEFAULT 0 CHECK (total_wins >= 0),
    total_losses INTEGER NOT NULL DEFAULT 0 CHECK (total_losses >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Habilitar RLS en profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para profiles
CREATE POLICY "Permitir lectura publica de perfiles"
    ON public.profiles FOR SELECT
    USING (true);

CREATE POLICY "Permitir actualizacion a los propios usuarios"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Trigger para creación automática de perfil tras el registro en auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, username, avatar_url)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'username', 'entrenador_' || substr(new.id::text, 1, 8)),
        new.raw_user_meta_data->>'avatar_url'
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- =====================================================================
-- 2. TABLA: cards (Catálogo de 120 cartas de Pokémon Gen 9)
-- =====================================================================
CREATE TABLE public.cards (
    id SERIAL PRIMARY KEY,
    pokemon_id INTEGER UNIQUE NOT NULL CHECK (pokemon_id > 0),
    name TEXT NOT NULL,
    image_url TEXT NOT NULL,
    type_primary TEXT NOT NULL,
    type_secondary TEXT,
    attack_points INTEGER NOT NULL CHECK (attack_points >= 0),
    defense_points INTEGER NOT NULL CHECK (defense_points >= 0),
    hp_points INTEGER NOT NULL CHECK (hp_points >= 0),
    special_ability TEXT NOT NULL,
    special_ability_description TEXT NOT NULL,
    rarity TEXT NOT NULL CHECK (rarity IN ('common', 'uncommon', 'rare', 'legendary')),
    level INTEGER NOT NULL CHECK (level >= 1)
);

-- Habilitar RLS en cards
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para cards
CREATE POLICY "Permitir lectura publica de cartas"
    ON public.cards FOR SELECT
    USING (true);

-- Nota: No se añaden políticas de escritura (INSERT/UPDATE/DELETE) para clientes públicos,
-- lo que restringe toda modificación al catálogo exclusivamente al rol service_role (sistema).

-- =====================================================================
-- 3. TABLA: decks
-- =====================================================================
CREATE TABLE public.decks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL CHECK (char_length(name) >= 1),
    is_active BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Habilitar RLS en decks
ALTER TABLE public.decks ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para decks
CREATE POLICY "Permitir lectura de mazos propios"
    ON public.decks FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Permitir insercion de mazos propios"
    ON public.decks FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Permitir actualizacion de mazos propios"
    ON public.decks FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Permitir eliminacion de mazos propios"
    ON public.decks FOR DELETE
    USING (auth.uid() = user_id);

-- Trigger: Cuando un mazo se marca como activo, desactivar todos los demás del mismo usuario
CREATE OR REPLACE FUNCTION public.handle_active_deck()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_active = true THEN
        UPDATE public.decks
        SET is_active = false
        WHERE user_id = NEW.user_id AND id <> NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER on_deck_active_change
    BEFORE INSERT OR UPDATE OF is_active ON public.decks
    FOR EACH ROW
    WHEN (NEW.is_active = true)
    EXECUTE PROCEDURE public.handle_active_deck();

-- =====================================================================
-- 4. TABLA: deck_cards (Relación mazo-cartas, máx 20 cartas por mazo)
-- =====================================================================
CREATE TABLE public.deck_cards (
    id SERIAL PRIMARY KEY,
    deck_id UUID NOT NULL REFERENCES public.decks(id) ON DELETE CASCADE,
    card_id INTEGER NOT NULL REFERENCES public.cards(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 1 AND quantity <= 3),
    UNIQUE (deck_id, card_id)
);

-- Habilitar RLS en deck_cards
ALTER TABLE public.deck_cards ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para deck_cards
CREATE POLICY "Permitir lectura de cartas de mazo propio"
    ON public.deck_cards FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.decks
            WHERE decks.id = deck_cards.deck_id AND decks.user_id = auth.uid()
        )
    );

CREATE POLICY "Permitir insercion de cartas en mazo propio"
    ON public.deck_cards FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.decks
            WHERE decks.id = deck_id AND decks.user_id = auth.uid()
        )
    );

CREATE POLICY "Permitir actualizacion de cartas en mazo propio"
    ON public.deck_cards FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.decks
            WHERE decks.id = deck_cards.deck_id AND decks.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.decks
            WHERE decks.id = deck_cards.deck_id AND decks.user_id = auth.uid()
        )
    );

CREATE POLICY "Permitir eliminacion de cartas de mazo propio"
    ON public.deck_cards FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.decks
            WHERE decks.id = deck_cards.deck_id AND decks.user_id = auth.uid()
        )
    );

-- Trigger: Impedir que un mazo supere las 20 cartas en total
CREATE OR REPLACE FUNCTION public.check_deck_card_limit()
RETURNS TRIGGER AS $$
DECLARE
    var_total_cards INTEGER;
BEGIN
    -- Sumar la cantidad de cartas ya guardadas, excluyendo el ID actual si es un update
    SELECT COALESCE(SUM(quantity), 0) INTO var_total_cards
    FROM public.deck_cards
    WHERE deck_id = NEW.deck_id AND id <> COALESCE(NEW.id, -1);

    IF (var_total_cards + NEW.quantity) > 20 THEN
        RAISE EXCEPTION 'El mazo no puede superar el límite de 20 cartas en total. Cartas actuales: %, intentando agregar %.',
            var_total_cards, NEW.quantity;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER validate_deck_card_limit
    BEFORE INSERT OR UPDATE OF quantity ON public.deck_cards
    FOR EACH ROW EXECUTE PROCEDURE public.check_deck_card_limit();

-- =====================================================================
-- 5. TABLA: game_rooms
-- =====================================================================
CREATE TABLE public.game_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_code TEXT UNIQUE NOT NULL CHECK (char_length(room_code) = 6),
    player1_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    player2_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'in_progress', 'finished')),
    current_turn UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    game_state JSONB NOT NULL DEFAULT '{}'::jsonB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_different_players CHECK (player1_id <> player2_id)
);

-- Habilitar RLS en game_rooms
ALTER TABLE public.game_rooms ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para game_rooms
CREATE POLICY "Permitir lectura de salas esperando o si es participante"
    ON public.game_rooms FOR SELECT
    USING (
        status = 'waiting'
        OR auth.uid() = player1_id
        OR auth.uid() = player2_id
    );

CREATE POLICY "Permitir creacion de salas a usuarios autenticados"
    ON public.game_rooms FOR INSERT
    WITH CHECK (
        auth.role() = 'authenticated'
        AND auth.uid() = player1_id
    );

CREATE POLICY "Permitir actualizacion a participantes de la sala"
    ON public.game_rooms FOR UPDATE
    USING (
        auth.uid() = player1_id
        OR auth.uid() = player2_id
    )
    WITH CHECK (
        auth.uid() = player1_id
        OR auth.uid() = player2_id
    );

-- Trigger: Actualización automática de la columna updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER update_game_rooms_updated_at
    BEFORE UPDATE ON public.game_rooms
    FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

-- =====================================================================
-- 6. TABLA: match_results
-- =====================================================================
CREATE TABLE public.match_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID REFERENCES public.game_rooms(id) ON DELETE SET NULL,
    winner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    loser_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    match_type TEXT NOT NULL CHECK (match_type IN ('pvp', 'pve')),
    winner_final_lp INTEGER NOT NULL CHECK (winner_final_lp >= 0),
    total_turns INTEGER NOT NULL CHECK (total_turns >= 0),
    duration_seconds INTEGER NOT NULL CHECK (duration_seconds >= 0),
    ended_by TEXT NOT NULL CHECK (ended_by IN ('lp_zero', 'no_cards', 'surrender')),
    played_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_different_winner_loser CHECK (winner_id <> loser_id)
);

-- Habilitar RLS en match_results
ALTER TABLE public.match_results ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para match_results
CREATE POLICY "Permitir lectura publica de resultados"
    ON public.match_results FOR SELECT
    USING (true);

-- Nota: No se definen políticas de escritura para clientes, solo el rol service_role (sistema)
-- puede insertar resultados directamente tras finalizar partidas.

-- Trigger: Actualizar de manera automática wins/losses en los perfiles
CREATE OR REPLACE FUNCTION public.update_profile_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Incrementar victorias al ganador
    UPDATE public.profiles
    SET total_wins = total_wins + 1
    WHERE id = NEW.winner_id;

    -- Incrementar derrotas al perdedor
    UPDATE public.profiles
    SET total_losses = total_losses + 1
    WHERE id = NEW.loser_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_match_result_inserted
    AFTER INSERT ON public.match_results
    FOR EACH ROW EXECUTE PROCEDURE public.update_profile_stats();

-- =====================================================================
-- 7. TABLA: game_actions (Log de acciones de sincronización)
-- =====================================================================
CREATE TABLE public.game_actions (
    id SERIAL PRIMARY KEY,
    room_id UUID NOT NULL REFERENCES public.game_rooms(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL CHECK (action_type IN ('draw', 'summon', 'attack', 'ability', 'end_turn')),
    action_data JSONB NOT NULL DEFAULT '{}'::jsonB,
    turn_number INTEGER NOT NULL CHECK (turn_number >= 1),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Habilitar RLS en game_actions
ALTER TABLE public.game_actions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para game_actions
CREATE POLICY "Permitir lectura de acciones a participantes"
    ON public.game_actions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.game_rooms
            WHERE game_rooms.id = game_actions.room_id
            AND (game_rooms.player1_id = auth.uid() OR game_rooms.player2_id = auth.uid())
        )
    );

CREATE POLICY "Permitir insercion de acciones a participantes"
    ON public.game_actions FOR INSERT
    WITH CHECK (
        player_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.game_rooms
            WHERE game_rooms.id = room_id
            AND (game_rooms.player1_id = auth.uid() OR game_rooms.player2_id = auth.uid())
        )
    );

-- =====================================================================
-- ÍNDICES DE RENDIMIENTO (OPTIMIZACIÓN DE BÚSQUEDAS)
-- =====================================================================
CREATE INDEX idx_decks_user_id ON public.decks(user_id);
CREATE INDEX idx_deck_cards_deck_id ON public.deck_cards(deck_id);
CREATE INDEX idx_game_rooms_room_code ON public.game_rooms(room_code);
CREATE INDEX idx_game_rooms_status ON public.game_rooms(status);
CREATE INDEX idx_match_results_winner_id ON public.match_results(winner_id);
CREATE INDEX idx_match_results_loser_id ON public.match_results(loser_id);
CREATE INDEX idx_game_actions_room_id ON public.game_actions(room_id);

-- =====================================================================
-- FIN DEL ESQUEMA
-- =====================================================================
