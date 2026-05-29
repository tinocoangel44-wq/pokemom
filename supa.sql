UPDATE cards SET pre_evolution_name = 'Sprigatito' WHERE name = 'Floragato';
UPDATE cards SET pre_evolution_name = 'Floragato' WHERE name = 'Meowscarada';
UPDATE cards SET pre_evolution_name = 'Fuecoco' WHERE name = 'Crocalor';
UPDATE cards SET pre_evolution_name = 'Crocalor' WHERE name = 'Skeledirge';
UPDATE cards SET pre_evolution_name = 'Quaxly' WHERE name = 'Quaxwell';
UPDATE cards SET pre_evolution_name = 'Quaxwell' WHERE name = 'Quaquaval';
UPDATE cards SET pre_evolution_name = 'Lechonk' WHERE name = 'Oinkologne';
UPDATE cards SET pre_evolution_name = 'Tarountula' WHERE name = 'Spidops';
UPDATE cards SET pre_evolution_name = 'Nymble' WHERE name = 'Lokix';
UPDATE cards SET pre_evolution_name = 'Pawmi' WHERE name = 'Pawmo';
UPDATE cards SET pre_evolution_name = 'Pawmo' WHERE name = 'Pawmot';
UPDATE cards SET pre_evolution_name = 'Tandemaus' WHERE name = 'Maushold';
UPDATE cards SET pre_evolution_name = 'Fidough' WHERE name = 'Dachsbun';
UPDATE cards SET pre_evolution_name = 'Smoliv' WHERE name = 'Dolliv';
UPDATE cards SET pre_evolution_name = 'Dolliv' WHERE name = 'Arboliva';
UPDATE cards SET pre_evolution_name = 'Nacli' WHERE name = 'Naclstack';
UPDATE cards SET pre_evolution_name = 'Naclstack' WHERE name = 'Garganacl';
UPDATE cards SET pre_evolution_name = 'Charcadet' WHERE name = 'Armarouge';
UPDATE cards SET pre_evolution_name = 'Charcadet' WHERE name = 'Ceruledge';
UPDATE cards SET pre_evolution_name = 'Tadbulb' WHERE name = 'Bellibolt';
UPDATE cards SET pre_evolution_name = 'Wattrel' WHERE name = 'Kilowattrel';
UPDATE cards SET pre_evolution_name = 'Maschiff' WHERE name = 'Mabosstiff';
UPDATE cards SET pre_evolution_name = 'Shroodle' WHERE name = 'Grafaiai';
UPDATE cards SET pre_evolution_name = 'Bramblin' WHERE name = 'Brambleghast';
UPDATE cards SET pre_evolution_name = 'Toedscool' WHERE name = 'Toedscruel';
UPDATE cards SET pre_evolution_name = 'Capsakid' WHERE name = 'Scovillain';
UPDATE cards SET pre_evolution_name = 'Rellor' WHERE name = 'Rabsca';
UPDATE cards SET pre_evolution_name = 'Flittle' WHERE name = 'Espathra';
UPDATE cards SET pre_evolution_name = 'Tinkatink' WHERE name = 'Tinkatuff';
UPDATE cards SET pre_evolution_name = 'Tinkatuff' WHERE name = 'Tinkaton';
UPDATE cards SET pre_evolution_name = 'Wiglett' WHERE name = 'Wugtrio';
UPDATE cards SET pre_evolution_name = 'Finizen' WHERE name = 'Palafin';
UPDATE cards SET pre_evolution_name = 'Varoom' WHERE name = 'Revavroom';
UPDATE cards SET pre_evolution_name = 'Glimmet' WHERE name = 'Glimmora';
UPDATE cards SET pre_evolution_name = 'Greavard' WHERE name = 'Houndstone';
UPDATE cards SET pre_evolution_name = 'Cetoddle' WHERE name = 'Cetitan';
UPDATE cards SET pre_evolution_name = 'Primeape' WHERE name = 'Annihilape';
UPDATE cards SET pre_evolution_name = 'Wooper' WHERE name = 'Clodsire';
UPDATE cards SET pre_evolution_name = 'Girafarig' WHERE name = 'Farigiraf';
UPDATE cards SET pre_evolution_name = 'Dunsparce' WHERE name = 'Dudunsparce';
UPDATE cards SET pre_evolution_name = 'Bisharp' WHERE name = 'Kingambit';
UPDATE cards SET pre_evolution_name = 'Frigibax' WHERE name = 'Arctibax';
UPDATE cards SET pre_evolution_name = 'Arctibax' WHERE name = 'Baxcalibur';
UPDATE cards SET pre_evolution_name = 'Gimmighoul' WHERE name = 'Gholdengo';
UPDATE cards SET pre_evolution_name = 'Applin' WHERE name = 'Dipplin';
UPDATE cards SET pre_evolution_name = 'Poltchageist' WHERE name = 'Sinistcha';
UPDATE cards SET pre_evolution_name = 'Duraludon' WHERE name = 'Archaludon';
UPDATE cards SET pre_evolution_name = 'Dipplin' WHERE name = 'Hydrapple';

CREATE TABLE IF NOT EXISTS match_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    fecha TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    rival TEXT NOT NULL,
    resultado TEXT NOT NULL,
    duracion_turnos INTEGER NOT NULL
);
