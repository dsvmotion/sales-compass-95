import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Complete European countries list with ISO codes
const EUROPEAN_COUNTRIES = [
  { code: "AL", name: "Albania", name_local: "Shqipëri" },
  { code: "AD", name: "Andorra", name_local: "Andorra" },
  { code: "AT", name: "Austria", name_local: "Österreich" },
  { code: "BY", name: "Belarus", name_local: "Беларусь" },
  { code: "BE", name: "Belgium", name_local: "België" },
  { code: "BA", name: "Bosnia and Herzegovina", name_local: "Bosna i Hercegovina" },
  { code: "BG", name: "Bulgaria", name_local: "България" },
  { code: "HR", name: "Croatia", name_local: "Hrvatska" },
  { code: "CY", name: "Cyprus", name_local: "Κύπρος" },
  { code: "CZ", name: "Czech Republic", name_local: "Česká republika" },
  { code: "DK", name: "Denmark", name_local: "Danmark" },
  { code: "EE", name: "Estonia", name_local: "Eesti" },
  { code: "FI", name: "Finland", name_local: "Suomi" },
  { code: "FR", name: "France", name_local: "France" },
  { code: "DE", name: "Germany", name_local: "Deutschland" },
  { code: "GR", name: "Greece", name_local: "Ελλάδα" },
  { code: "HU", name: "Hungary", name_local: "Magyarország" },
  { code: "IS", name: "Iceland", name_local: "Ísland" },
  { code: "IE", name: "Ireland", name_local: "Éire" },
  { code: "IT", name: "Italy", name_local: "Italia" },
  { code: "XK", name: "Kosovo", name_local: "Kosovë" },
  { code: "LV", name: "Latvia", name_local: "Latvija" },
  { code: "LI", name: "Liechtenstein", name_local: "Liechtenstein" },
  { code: "LT", name: "Lithuania", name_local: "Lietuva" },
  { code: "LU", name: "Luxembourg", name_local: "Lëtzebuerg" },
  { code: "MT", name: "Malta", name_local: "Malta" },
  { code: "MD", name: "Moldova", name_local: "Moldova" },
  { code: "MC", name: "Monaco", name_local: "Monaco" },
  { code: "ME", name: "Montenegro", name_local: "Crna Gora" },
  { code: "MA", name: "Morocco", name_local: "المغرب" },
  { code: "NL", name: "Netherlands", name_local: "Nederland" },
  { code: "MK", name: "North Macedonia", name_local: "Северна Македонија" },
  { code: "NO", name: "Norway", name_local: "Norge" },
  { code: "PL", name: "Poland", name_local: "Polska" },
  { code: "PT", name: "Portugal", name_local: "Portugal" },
  { code: "RO", name: "Romania", name_local: "România" },
  { code: "RU", name: "Russia", name_local: "Россия" },
  { code: "SM", name: "San Marino", name_local: "San Marino" },
  { code: "RS", name: "Serbia", name_local: "Србија" },
  { code: "SK", name: "Slovakia", name_local: "Slovensko" },
  { code: "SI", name: "Slovenia", name_local: "Slovenija" },
  { code: "ES", name: "Spain", name_local: "España" },
  { code: "SE", name: "Sweden", name_local: "Sverige" },
  { code: "CH", name: "Switzerland", name_local: "Schweiz" },
  { code: "TR", name: "Turkey", name_local: "Türkiye" },
  { code: "UA", name: "Ukraine", name_local: "Україна" },
  { code: "GB", name: "United Kingdom", name_local: "United Kingdom" },
  { code: "VA", name: "Vatican City", name_local: "Città del Vaticano" },
];

// Spanish provinces and cities (complete)
const SPAIN_DATA = {
  provinces: [
    { code: "A", name: "Alicante", name_local: "Alacant" },
    { code: "AB", name: "Albacete", name_local: "Albacete" },
    { code: "AL", name: "Almería", name_local: "Almería" },
    { code: "AV", name: "Ávila", name_local: "Ávila" },
    { code: "B", name: "Barcelona", name_local: "Barcelona" },
    { code: "BA", name: "Badajoz", name_local: "Badajoz" },
    { code: "BI", name: "Vizcaya", name_local: "Bizkaia" },
    { code: "BU", name: "Burgos", name_local: "Burgos" },
    { code: "C", name: "A Coruña", name_local: "A Coruña" },
    { code: "CA", name: "Cádiz", name_local: "Cádiz" },
    { code: "CC", name: "Cáceres", name_local: "Cáceres" },
    { code: "CE", name: "Ceuta", name_local: "Ceuta" },
    { code: "CO", name: "Córdoba", name_local: "Córdoba" },
    { code: "CR", name: "Ciudad Real", name_local: "Ciudad Real" },
    { code: "CS", name: "Castellón", name_local: "Castelló" },
    { code: "CU", name: "Cuenca", name_local: "Cuenca" },
    { code: "GC", name: "Las Palmas", name_local: "Las Palmas" },
    { code: "GI", name: "Girona", name_local: "Girona" },
    { code: "GR", name: "Granada", name_local: "Granada" },
    { code: "GU", name: "Guadalajara", name_local: "Guadalajara" },
    { code: "H", name: "Huelva", name_local: "Huelva" },
    { code: "HU", name: "Huesca", name_local: "Huesca" },
    { code: "J", name: "Jaén", name_local: "Jaén" },
    { code: "L", name: "Lleida", name_local: "Lleida" },
    { code: "LE", name: "León", name_local: "León" },
    { code: "LO", name: "La Rioja", name_local: "La Rioja" },
    { code: "LU", name: "Lugo", name_local: "Lugo" },
    { code: "M", name: "Madrid", name_local: "Madrid" },
    { code: "MA", name: "Málaga", name_local: "Málaga" },
    { code: "ML", name: "Melilla", name_local: "Melilla" },
    { code: "MU", name: "Murcia", name_local: "Murcia" },
    { code: "NA", name: "Navarra", name_local: "Nafarroa" },
    { code: "O", name: "Asturias", name_local: "Asturies" },
    { code: "OR", name: "Ourense", name_local: "Ourense" },
    { code: "P", name: "Palencia", name_local: "Palencia" },
    { code: "PM", name: "Baleares", name_local: "Illes Balears" },
    { code: "PO", name: "Pontevedra", name_local: "Pontevedra" },
    { code: "S", name: "Cantabria", name_local: "Cantabria" },
    { code: "SA", name: "Salamanca", name_local: "Salamanca" },
    { code: "SE", name: "Sevilla", name_local: "Sevilla" },
    { code: "SG", name: "Segovia", name_local: "Segovia" },
    { code: "SO", name: "Soria", name_local: "Soria" },
    { code: "SS", name: "Guipúzcoa", name_local: "Gipuzkoa" },
    { code: "T", name: "Tarragona", name_local: "Tarragona" },
    { code: "TE", name: "Teruel", name_local: "Teruel" },
    { code: "TF", name: "Santa Cruz de Tenerife", name_local: "Santa Cruz de Tenerife" },
    { code: "TO", name: "Toledo", name_local: "Toledo" },
    { code: "V", name: "Valencia", name_local: "València" },
    { code: "VA", name: "Valladolid", name_local: "Valladolid" },
    { code: "VI", name: "Álava", name_local: "Araba" },
    { code: "Z", name: "Zaragoza", name_local: "Zaragoza" },
    { code: "ZA", name: "Zamora", name_local: "Zamora" },
  ],
  cities: {
    "Madrid": ["Madrid", "Alcalá de Henares", "Móstoles", "Fuenlabrada", "Leganés", "Getafe", "Alcorcón", "Torrejón de Ardoz", "Parla", "Alcobendas", "Las Rozas", "San Sebastián de los Reyes", "Pozuelo de Alarcón", "Coslada", "Rivas-Vaciamadrid", "Valdemoro", "Majadahonda", "Collado Villalba", "Aranjuez", "Arganda del Rey"],
    "Barcelona": ["Barcelona", "Hospitalet de Llobregat", "Badalona", "Terrassa", "Sabadell", "Mataró", "Santa Coloma de Gramenet", "Cornellà de Llobregat", "Sant Cugat del Vallès", "Sant Boi de Llobregat", "Rubí", "Manresa", "Vilanova i la Geltrú", "El Prat de Llobregat", "Viladecans", "Granollers", "Cerdanyola del Vallès", "Mollet del Vallès", "Castelldefels", "Esplugues de Llobregat"],
    "Valencia": ["Valencia", "Torrent", "Gandía", "Paterna", "Sagunto", "Mislata", "Burjassot", "Ontinyent", "Aldaia", "Manises", "Alfafar", "Xirivella", "Quart de Poblet", "Catarroja", "Alaquàs", "Sueca", "Cullera", "Requena", "Alzira", "Xàtiva"],
    "Sevilla": ["Sevilla", "Dos Hermanas", "Alcalá de Guadaíra", "Utrera", "Mairena del Aljarafe", "Écija", "La Rinconada", "Carmona", "San Juan de Aznalfarache", "Coria del Río", "Tomares", "Bormujos", "Lebrija", "Osuna", "Los Palacios y Villafranca", "Marchena", "Morón de la Frontera", "Camas", "Arahal", "Alcalá del Río"],
    "Málaga": ["Málaga", "Marbella", "Mijas", "Vélez-Málaga", "Fuengirola", "Torremolinos", "Benalmádena", "Estepona", "Ronda", "Antequera", "Rincón de la Victoria", "Alhaurín de la Torre", "Alhaurín el Grande", "Coín", "Cártama", "Nerja", "Torrox", "Manilva", "Casares", "Ojén"],
    "Murcia": ["Murcia", "Cartagena", "Lorca", "Molina de Segura", "Alcantarilla", "Mazarrón", "Cieza", "Águilas", "Yecla", "Torre-Pacheco", "San Javier", "Totana", "Caravaca de la Cruz", "Las Torres de Cotillas", "San Pedro del Pinatar", "Jumilla", "Archena", "Santomera", "Alhama de Murcia", "Beniel"],
    "Alicante": ["Alicante", "Elche", "Torrevieja", "Orihuela", "Benidorm", "Alcoy", "Elda", "San Vicente del Raspeig", "Denia", "Villena", "Petrer", "Santa Pola", "Crevillent", "Novelda", "Ibi", "Altea", "Jávea", "Calpe", "Villajoyosa", "Aspe"],
    "Vizcaya": ["Bilbao", "Barakaldo", "Getxo", "Portugalete", "Santurtzi", "Basauri", "Leioa", "Galdakao", "Durango", "Erandio", "Sestao", "Bermeo", "Gernika-Lumo", "Amorebieta-Etxano", "Mungia", "Sopela", "Arrigorriaga", "Ermua", "Ortuella", "Ondarroa"],
    "Zaragoza": ["Zaragoza", "Calatayud", "Utebo", "Ejea de los Caballeros", "Tarazona", "Caspe", "La Almunia de Doña Godina", "Cuarte de Huerva", "Zuera", "Tauste", "Alagón", "Illueca", "María de Huerva", "Villanueva de Gállego", "Alfajarín", "Borja", "Épila", "Gallur", "Fuentes de Ebro", "Mallén"],
    "Las Palmas": ["Las Palmas de Gran Canaria", "Telde", "Santa Lucía de Tirajana", "Arrecife", "San Bartolomé de Tirajana", "Arucas", "Ingenio", "Agüimes", "Puerto del Rosario", "Gáldar", "Mogán", "Teguise", "La Oliva", "Teror", "Tías", "Firgas", "Valsequillo de Gran Canaria", "Antigua", "Pájara", "Yaiza"],
    "Santa Cruz de Tenerife": ["Santa Cruz de Tenerife", "San Cristóbal de La Laguna", "Arona", "Adeje", "La Orotava", "Granadilla de Abona", "Los Realejos", "Puerto de la Cruz", "Candelaria", "Tacoronte", "Güímar", "San Miguel de Abona", "Icod de los Vinos", "Santiago del Teide", "Santa Úrsula", "El Rosario", "Guía de Isora", "Tegueste", "La Victoria de Acentejo", "Los Llanos de Aridane"],
    "A Coruña": ["A Coruña", "Santiago de Compostela", "Ferrol", "Narón", "Oleiros", "Arteixo", "Carballo", "Culleredo", "Cambre", "Ares", "Ribeira", "Betanzos", "Boiro", "Cedeira", "Noia", "Ordes", "Sada", "Pontedeume", "Rianxo", "Fene"],
    "Asturias": ["Oviedo", "Gijón", "Avilés", "Siero", "Langreo", "Mieres", "Castrillón", "San Martín del Rey Aurelio", "Corvera de Asturias", "Laviana", "Llanera", "Villaviciosa", "Navia", "Llanes", "Pravia", "Carreño", "Cangas del Narcea", "Piloña", "Tineo", "Aller"],
    "Guipúzcoa": ["San Sebastián", "Irún", "Errenteria", "Zarautz", "Eibar", "Hernani", "Arrasate", "Hondarribia", "Tolosa", "Lasarte-Oria", "Andoain", "Oñati", "Bergara", "Azpeitia", "Azkoitia", "Pasaia", "Lezo", "Urretxu", "Zumaia", "Usurbil"],
    "Cantabria": ["Santander", "Torrelavega", "Castro-Urdiales", "Camargo", "Piélagos", "El Astillero", "Laredo", "Santoña", "Santa Cruz de Bezana", "Los Corrales de Buelna", "Reocín", "Suances", "Reinosa", "Colindres", "Cabezón de la Sal", "San Vicente de la Barquera", "Ampuero", "Marina de Cudeyo", "Medio Cudeyo", "Ribamontán al Mar"],
    "Navarra": ["Pamplona", "Tudela", "Barañáin", "Burlada", "Estella", "Zizur Mayor", "Tafalla", "Villava", "Ansoáin", "Berriozar", "Alsasua", "Corella", "Cintruénigo", "Sangüesa", "Noáin", "Huarte", "Peralta", "San Adrián", "Lodosa", "Castejón"],
    "La Rioja": ["Logroño", "Calahorra", "Arnedo", "Haro", "Alfaro", "Lardero", "Nájera", "Santo Domingo de la Calzada", "Villamediana de Iregua", "Autol", "Rincón de Soto", "Pradejón", "Fuenmayor", "Navarrete", "Cervera del Río Alhama", "Aldeanueva de Ebro", "Albelda de Iregua", "Cenicero", "Ezcaray", "San Asensio"],
    "Baleares": ["Palma", "Calvià", "Ibiza", "Manacor", "Llucmajor", "Marratxí", "Inca", "Santa Eulària des Riu", "Sant Josep de sa Talaia", "Ciudadela de Menorca", "Mahón", "Felanitx", "Pollença", "Alcúdia", "Sóller", "Sant Antoni de Portmany", "Santanyí", "Sa Pobla", "Son Servera", "Campos"],
    "Pontevedra": ["Vigo", "Pontevedra", "Vilagarcía de Arousa", "Redondela", "Cangas", "Marín", "Ponteareas", "Lalín", "Sanxenxo", "O Porriño", "Mos", "Bueu", "Tui", "A Estrada", "O Grove", "Vilanova de Arousa", "Nigrán", "Poio", "Gondomar", "Baiona"],
    "Girona": ["Girona", "Figueres", "Blanes", "Lloret de Mar", "Olot", "Salt", "Palafrugell", "Sant Feliu de Guíxols", "Roses", "Banyoles", "La Bisbal d'Empordà", "Torroella de Montgrí", "Platja d'Aro", "Santa Coloma de Farners", "Palamós", "Cassà de la Selva", "L'Escala", "Ripoll", "Llagostera", "Castelló d'Empúries"],
    "Tarragona": ["Tarragona", "Reus", "El Vendrell", "Cambrils", "Tortosa", "Salou", "Valls", "Vila-seca", "Amposta", "Calafell", "Sant Carles de la Ràpita", "Cunit", "Constantí", "La Canonja", "Torredembarra", "Deltebre", "Mont-roig del Camp", "L'Arboç", "Montblanc", "Falset"],
    "Lleida": ["Lleida", "Balaguer", "Tàrrega", "Mollerussa", "La Seu d'Urgell", "Cervera", "Almacelles", "Les Borges Blanques", "Alcarràs", "Alpicat", "Solsona", "Tremp", "Agramunt", "Guissona", "Artesa de Segre", "Bellpuig", "Rosselló", "Torres de Segre", "Vielha e Mijaran", "Sort"],
    "Cádiz": ["Cádiz", "Jerez de la Frontera", "Algeciras", "San Fernando", "El Puerto de Santa María", "Chiclana de la Frontera", "Sanlúcar de Barrameda", "La Línea de la Concepción", "Puerto Real", "Rota", "Arcos de la Frontera", "Los Barrios", "Conil de la Frontera", "Barbate", "Tarifa", "San Roque", "Ubrique", "Vejer de la Frontera", "Chipiona", "Medina-Sidonia"],
    "Granada": ["Granada", "Motril", "Almuñécar", "Armilla", "Maracena", "Baza", "Loja", "Las Gabias", "Guadix", "Atarfe", "Salobreña", "Albolote", "Peligros", "Huétor Vega", "Ogíjares", "Santa Fe", "Churriana de la Vega", "La Zubia", "Cúllar Vega", "Pinos Puente"],
    "Córdoba": ["Córdoba", "Lucena", "Puente Genil", "Montilla", "Priego de Córdoba", "Cabra", "Baena", "Palma del Río", "Pozoblanco", "Peñarroya-Pueblonuevo", "Aguilar de la Frontera", "La Carlota", "Fernán-Núñez", "Castro del Río", "Rute", "Montoro", "Villa del Río", "Bujalance", "Villanueva de Córdoba", "Hinojosa del Duque"],
    "Almería": ["Almería", "El Ejido", "Roquetas de Mar", "Níjar", "Adra", "Vícar", "Huércal-Overa", "Huércal de Almería", "Vera", "Berja", "Cuevas del Almanzora", "Garrucha", "Mojácar", "Carboneras", "Pulpí", "Albox", "Dalías", "Macael", "Vélez-Rubio", "Fiñana"],
    "Jaén": ["Jaén", "Linares", "Andújar", "Úbeda", "Martos", "Alcalá la Real", "Baeza", "La Carolina", "Bailén", "Jódar", "Torredonjimeno", "Mengíbar", "Mancha Real", "Villacarrillo", "Alcaudete", "Torredelcampo", "Villanueva del Arzobispo", "Porcuna", "Cazorla", "Arjona"],
    "Huelva": ["Huelva", "Lepe", "Almonte", "Isla Cristina", "Ayamonte", "Moguer", "Punta Umbría", "Aljaraque", "Cartaya", "Bollullos Par del Condado", "La Palma del Condado", "San Juan del Puerto", "Gibraleón", "Palos de la Frontera", "Trigueros", "Valverde del Camino", "Nerva", "Rociana del Condado", "Bonares", "Aracena"],
    "Badajoz": ["Badajoz", "Mérida", "Don Benito", "Almendralejo", "Villanueva de la Serena", "Zafra", "Montijo", "Olivenza", "Villafranca de los Barros", "Jerez de los Caballeros", "Guareña", "Azuaga", "Los Santos de Maimona", "San Vicente de Alcántara", "Talavera la Real", "Llerena", "Calamonte", "Puebla de la Calzada", "Castuera", "La Zarza"],
    "Cáceres": ["Cáceres", "Plasencia", "Navalmoral de la Mata", "Miajadas", "Coria", "Trujillo", "Moraleja", "Talayuela", "Jaraíz de la Vera", "Montehermoso", "Malpartida de Cáceres", "Arroyo de la Luz", "Valencia de Alcántara", "Casar de Cáceres", "Hervás", "Jarandilla de la Vera", "Logrosán", "Guadalupe", "Zorita", "Garrovillas de Alconétar"],
    "León": ["León", "Ponferrada", "San Andrés del Rabanedo", "Villaquilambre", "La Bañeza", "Astorga", "Bembibre", "Villablino", "Cacabelos", "Valencia de Don Juan", "Cistierna", "Carbajal de la Legua", "Mansilla de las Mulas", "Sahagún", "La Robla", "Santa María del Páramo", "Villarejo de Órbigo", "Boñar", "Fabero", "Toral de los Vados"],
    "Salamanca": ["Salamanca", "Béjar", "Ciudad Rodrigo", "Santa Marta de Tormes", "Carbajosa de la Sagrada", "Villamayor", "Villares de la Reina", "Peñaranda de Bracamonte", "Guijuelo", "Alba de Tormes", "Ledesma", "Terradillos", "Lumbrales", "Vitigudino", "Castellanos de Moriscos", "San Cristóbal de la Cuesta", "Calvarrasa de Abajo", "Doñinos de Salamanca", "Arapiles", "Cabrerizos"],
    "Valladolid": ["Valladolid", "Medina del Campo", "Laguna de Duero", "Arroyo de la Encomienda", "Tordesillas", "Tudela de Duero", "Medina de Rioseco", "Íscar", "Peñafiel", "Simancas", "Cigales", "Santovenia de Pisuerga", "Zaratán", "La Cistérniga", "Aldeamayor de San Martín", "Renedo de Esgueva", "Villanueva de Duero", "Viana de Cega", "Valdestillas", "Cabezón de Pisuerga"],
    "Burgos": ["Burgos", "Miranda de Ebro", "Aranda de Duero", "Briviesca", "Villarcayo de Merindad de Castilla la Vieja", "Medina de Pomar", "Lerma", "Salas de los Infantes", "Belorado", "Espinosa de los Monteros", "Roa", "Villasana de Mena", "Pradoluengo", "Quintanar de la Sierra", "Melgar de Fernamental", "Castrojeriz", "Pancorbo", "Poza de la Sal", "Oña", "Covarrubias"],
    "Palencia": ["Palencia", "Aguilar de Campoo", "Guardo", "Venta de Baños", "Dueñas", "Carrión de los Condes", "Villamuriel de Cerrato", "Cervera de Pisuerga", "Paredes de Nava", "Herrera de Pisuerga", "Saldaña", "Ampudia", "Baltanás", "Astudillo", "Villalobón", "Becerril de Campos", "Osorno la Mayor", "Frómista", "Villada", "Magaz de Pisuerga"],
    "Segovia": ["Segovia", "Cuéllar", "El Espinar", "San Ildefonso", "Cantalejo", "Carbonero el Mayor", "Palazuelos de Eresma", "Nava de la Asunción", "Riaza", "Villacastín", "Ayllón", "Sepúlveda", "Coca", "Turégano", "Hontalbilla", "Bernuy de Porreros", "Marugán", "Navalmanzano", "Boceguillas", "Fuentepelayo"],
    "Soria": ["Soria", "Almazán", "El Burgo de Osma-Ciudad de Osma", "San Esteban de Gormaz", "Ólvega", "Golmayo", "Ágreda", "Arcos de Jalón", "San Leonardo de Yagüe", "Duruelo de la Sierra", "Covaleda", "Vinuesa", "Medinaceli", "Navaleno", "Quintana Redonda", "Berlanga de Duero", "Langa de Duero", "Morón de Almazán", "Garray", "Los Rábanos"],
    "Ávila": ["Ávila", "Arévalo", "Arenas de San Pedro", "Las Navas del Marqués", "Candeleda", "Sotillo de la Adrada", "El Barco de Ávila", "El Tiemblo", "Cebreros", "Piedrahíta", "La Adrada", "Mombeltrán", "Navaluenga", "Burgohondo", "San Martín de Valdeiglesias", "Madrigal de las Altas Torres", "Pedro Bernardo", "El Hoyo de Pinares", "Navalperal de Pinares", "Lanzahíta"],
    "Zamora": ["Zamora", "Benavente", "Toro", "Morales del Vino", "Puebla de Sanabria", "Villalpando", "Fuentesaúco", "Fermoselle", "Villaralbo", "Bermillo de Sayago", "Corrales del Vino", "Moraleja del Vino", "Alcañices", "Vezdemarbán", "Coreses", "Santibáñez de Vidriales", "Villabrázaro", "Muelas del Pan", "Pereruela", "Manganeses de la Lampreana"],
    "Ourense": ["Ourense", "Verín", "O Barco de Valdeorras", "Carballiño", "O Carballiño", "Xinzo de Limia", "Allariz", "Ribadavia", "Celanova", "Maceda", "A Rúa", "Viana do Bolo", "Bande", "O Pereiro de Aguiar", "Barbadás", "San Cibrao das Viñas", "Amoeiro", "Toén", "Coles", "Vilamarín"],
    "Lugo": ["Lugo", "Monforte de Lemos", "Viveiro", "Vilalba", "Sarria", "Ribadeo", "Foz", "Burela", "Chantada", "Guitiriz", "Mondoñedo", "Becerreá", "A Fonsagrada", "Cervo", "O Valadouro", "Xove", "Lourenzá", "Rábade", "O Corgo", "Outeiro de Rei"],
    "Toledo": ["Toledo", "Talavera de la Reina", "Illescas", "Seseña", "Torrijos", "Sonseca", "Mora", "Consuegra", "Madridejos", "Ocaña", "Fuensalida", "Quintanar de la Orden", "Villacañas", "Yuncos", "La Puebla de Montalbán", "Bargas", "Esquivias", "Añover de Tajo", "Olías del Rey", "Mocejón"],
    "Ciudad Real": ["Ciudad Real", "Puertollano", "Tomelloso", "Alcázar de San Juan", "Valdepeñas", "Manzanares", "Daimiel", "La Solana", "Miguelturra", "Socuéllamos", "Campo de Criptana", "Bolaños de Calatrava", "Almagro", "Villarrubia de los Ojos", "Argamasilla de Alba", "Pedro Muñoz", "Membrilla", "Malagón", "Almadén", "Herencia"],
    "Cuenca": ["Cuenca", "Tarancón", "Quintanar del Rey", "San Clemente", "Las Pedroñeras", "Motilla del Palancar", "Mota del Cuervo", "Villamayor de Santiago", "Iniesta", "Casasimarro", "Villanueva de la Jara", "Ledaña", "El Provencio", "Minglanilla", "Landete", "Belmonte", "La Almarcha", "Horcajo de Santiago", "Huete", "Priego"],
    "Albacete": ["Albacete", "Hellín", "Villarrobledo", "Almansa", "La Roda", "Caudete", "Tobarra", "Chinchilla de Monte-Aragón", "Casas-Ibáñez", "Tarazona de la Mancha", "Munera", "Madrigueras", "Ontur", "Fuenteálamo", "Elche de la Sierra", "Yeste", "Molinicos", "Balazote", "La Gineta", "Bonete"],
    "Guadalajara": ["Guadalajara", "Azuqueca de Henares", "Alovera", "El Casar", "Sigüenza", "Cabanillas del Campo", "Marchamalo", "Villanueva de la Torre", "Molina de Aragón", "Chiloeches", "Yunquera de Henares", "Mondéjar", "Pastrana", "Torrejón del Rey", "Brihuega", "Almonacid de Zorita", "Pioz", "Horche", "Cifuentes", "Sacedón"],
    "Huesca": ["Huesca", "Monzón", "Barbastro", "Jaca", "Fraga", "Sabiñánigo", "Binéfar", "Sariñena", "Tamarite de Litera", "Graus", "Alcañiz", "Aínsa-Sobrarbe", "Benasque", "Altorricón", "Almudévar", "Ayerbe", "Canfranc", "Panticosa", "Biescas", "Boltaña"],
    "Teruel": ["Teruel", "Alcañiz", "Andorra", "Calamocha", "Utrillas", "Alcorisa", "Cella", "Monreal del Campo", "Híjar", "Valderrobres", "Calanda", "Mora de Rubielos", "Rubielos de Mora", "Albarracín", "La Puebla de Valverde", "Sarrión", "Aliaga", "Montalbán", "Oliete", "Alloza"],
    "Castellón": ["Castellón de la Plana", "Vila-real", "Burriana", "Onda", "Benicàssim", "Vinaròs", "Almassora", "La Vall d'Uixó", "Benicarló", "Nules", "Oropesa del Mar", "Alcora", "Vilafamés", "Morella", "Segorbe", "Betxí", "Moncofa", "Torreblanca", "Cabanes", "Les Alqueries"],
  },
};

// French regions and cities
const FRANCE_DATA = {
  provinces: [
    { code: "IDF", name: "Île-de-France", name_local: "Île-de-France" },
    { code: "ARA", name: "Auvergne-Rhône-Alpes", name_local: "Auvergne-Rhône-Alpes" },
    { code: "NAQ", name: "Nouvelle-Aquitaine", name_local: "Nouvelle-Aquitaine" },
    { code: "OCC", name: "Occitanie", name_local: "Occitanie" },
    { code: "PAC", name: "Provence-Alpes-Côte d'Azur", name_local: "Provence-Alpes-Côte d'Azur" },
    { code: "HDF", name: "Hauts-de-France", name_local: "Hauts-de-France" },
    { code: "GES", name: "Grand Est", name_local: "Grand Est" },
    { code: "PDL", name: "Pays de la Loire", name_local: "Pays de la Loire" },
    { code: "BRE", name: "Bretagne", name_local: "Bretagne" },
    { code: "NOR", name: "Normandie", name_local: "Normandie" },
    { code: "BFC", name: "Bourgogne-Franche-Comté", name_local: "Bourgogne-Franche-Comté" },
    { code: "CVL", name: "Centre-Val de Loire", name_local: "Centre-Val de Loire" },
    { code: "COR", name: "Corse", name_local: "Corse" },
  ],
  cities: {
    "Île-de-France": ["Paris", "Boulogne-Billancourt", "Saint-Denis", "Argenteuil", "Montreuil", "Nanterre", "Créteil", "Versailles", "Vitry-sur-Seine", "Colombes", "Asnières-sur-Seine", "Courbevoie", "Aubervilliers", "Rueil-Malmaison", "Champigny-sur-Marne", "Saint-Maur-des-Fossés", "Drancy", "Issy-les-Moulineaux", "Noisy-le-Grand", "Levallois-Perret"],
    "Auvergne-Rhône-Alpes": ["Lyon", "Saint-Étienne", "Grenoble", "Villeurbanne", "Clermont-Ferrand", "Vénissieux", "Valence", "Chambéry", "Annecy", "Saint-Priest", "Vaulx-en-Velin", "Caluire-et-Cuire", "Bron", "Villefranche-sur-Saône", "Thonon-les-Bains", "Annemasse", "Roanne", "Montélimar", "Romans-sur-Isère", "Bourg-en-Bresse"],
    "Nouvelle-Aquitaine": ["Bordeaux", "Limoges", "Poitiers", "Mérignac", "Pau", "La Rochelle", "Pessac", "Angoulême", "Bayonne", "Brive-la-Gaillarde", "Niort", "Talence", "Agen", "Périgueux", "Villenave-d'Ornon", "Mont-de-Marsan", "Biarritz", "Bergerac", "Saint-Jean-de-Luz", "Royan"],
    "Occitanie": ["Toulouse", "Montpellier", "Nîmes", "Perpignan", "Béziers", "Narbonne", "Carcassonne", "Albi", "Tarbes", "Castres", "Sète", "Montauban", "Lunel", "Rodez", "Agde", "Alès", "Auch", "Cahors", "Millau", "Frontignan"],
    "Provence-Alpes-Côte d'Azur": ["Marseille", "Nice", "Toulon", "Aix-en-Provence", "Avignon", "Antibes", "Cannes", "La Seyne-sur-Mer", "Hyères", "Fréjus", "Arles", "Grasse", "Martigues", "Aubagne", "Salon-de-Provence", "Istres", "Cagnes-sur-Mer", "Gap", "Vitrolles", "Menton"],
    "Hauts-de-France": ["Lille", "Amiens", "Roubaix", "Tourcoing", "Dunkerque", "Calais", "Boulogne-sur-Mer", "Arras", "Villeneuve-d'Ascq", "Valenciennes", "Wattrelos", "Douai", "Lens", "Liévin", "Cambrai", "Saint-Quentin", "Maubeuge", "Beauvais", "Compiègne", "Laon"],
    "Grand Est": ["Strasbourg", "Reims", "Metz", "Mulhouse", "Nancy", "Colmar", "Troyes", "Charleville-Mézières", "Châlons-en-Champagne", "Épinal", "Haguenau", "Saint-Dizier", "Thionville", "Forbach", "Sélestat", "Schiltigheim", "Illkirch-Graffenstaden", "Vandœuvre-lès-Nancy", "Sarreguemines", "Verdun"],
    "Pays de la Loire": ["Nantes", "Le Mans", "Angers", "Saint-Nazaire", "La Roche-sur-Yon", "Cholet", "Laval", "Saint-Herblain", "Rezé", "Orvault", "Saumur", "Carquefou", "Couëron", "Bouguenais", "Saint-Sébastien-sur-Loire", "Vertou", "Les Sables-d'Olonne", "Mayenne", "Fontenay-le-Comte", "Challans"],
    "Bretagne": ["Rennes", "Brest", "Quimper", "Lorient", "Vannes", "Saint-Brieuc", "Saint-Malo", "Lanester", "Fougères", "Lannion", "Concarneau", "Vitré", "Morlaix", "Bruz", "Pontivy", "Cesson-Sévigné", "Ploemeur", "Douarnenez", "Dinan", "Guingamp"],
    "Normandie": ["Le Havre", "Rouen", "Caen", "Cherbourg-en-Cotentin", "Évreux", "Dieppe", "Saint-Étienne-du-Rouvray", "Sotteville-lès-Rouen", "Le Grand-Quevilly", "Alençon", "Lisieux", "Hérouville-Saint-Clair", "Mont-Saint-Aignan", "Fécamp", "Le Petit-Quevilly", "Granville", "Vernon", "Louviers", "Bayeux", "Argentan"],
    "Bourgogne-Franche-Comté": ["Dijon", "Besançon", "Belfort", "Chalon-sur-Saône", "Auxerre", "Nevers", "Mâcon", "Montbéliard", "Le Creusot", "Sens", "Beaune", "Dole", "Autun", "Pontarlier", "Vesoul", "Lons-le-Saunier", "Chenôve", "Talant", "Saint-Claude", "Joigny"],
    "Centre-Val de Loire": ["Tours", "Orléans", "Bourges", "Blois", "Châteauroux", "Chartres", "Joué-lès-Tours", "Dreux", "Montargis", "Vierzon", "Olivet", "Fleury-les-Aubrais", "Saint-Jean-de-Braye", "Vendôme", "Romorantin-Lanthenay", "Saint-Jean-de-la-Ruelle", "Issoudun", "Amboise", "Saran", "La Chapelle-Saint-Mesmin"],
    "Corse": ["Ajaccio", "Bastia", "Porto-Vecchio", "Corte", "Calvi", "Propriano", "Bonifacio", "Ghisonaccia", "Île-Rousse", "Sartène", "Biguglia", "Furiani", "Lucciana", "Borgo", "Santa-Maria-di-Lota", "Penta-di-Casinca", "Sarrola-Carcopino", "Cuttoli-Corticchiato", "Alata", "Ville-di-Pietrabugno"],
  },
};

// German states and cities
const GERMANY_DATA = {
  provinces: [
    { code: "BW", name: "Baden-Württemberg", name_local: "Baden-Württemberg" },
    { code: "BY", name: "Bavaria", name_local: "Bayern" },
    { code: "BE", name: "Berlin", name_local: "Berlin" },
    { code: "BB", name: "Brandenburg", name_local: "Brandenburg" },
    { code: "HB", name: "Bremen", name_local: "Bremen" },
    { code: "HH", name: "Hamburg", name_local: "Hamburg" },
    { code: "HE", name: "Hesse", name_local: "Hessen" },
    { code: "NI", name: "Lower Saxony", name_local: "Niedersachsen" },
    { code: "MV", name: "Mecklenburg-Vorpommern", name_local: "Mecklenburg-Vorpommern" },
    { code: "NW", name: "North Rhine-Westphalia", name_local: "Nordrhein-Westfalen" },
    { code: "RP", name: "Rhineland-Palatinate", name_local: "Rheinland-Pfalz" },
    { code: "SL", name: "Saarland", name_local: "Saarland" },
    { code: "SN", name: "Saxony", name_local: "Sachsen" },
    { code: "ST", name: "Saxony-Anhalt", name_local: "Sachsen-Anhalt" },
    { code: "SH", name: "Schleswig-Holstein", name_local: "Schleswig-Holstein" },
    { code: "TH", name: "Thuringia", name_local: "Thüringen" },
  ],
  cities: {
    "Baden-Württemberg": ["Stuttgart", "Mannheim", "Karlsruhe", "Freiburg", "Heidelberg", "Ulm", "Heilbronn", "Pforzheim", "Reutlingen", "Esslingen", "Ludwigsburg", "Tübingen", "Villingen-Schwenningen", "Konstanz", "Aalen", "Sindelfingen", "Friedrichshafen", "Schwäbisch Gmünd", "Offenburg", "Göppingen"],
    "Bavaria": ["Munich", "Nuremberg", "Augsburg", "Regensburg", "Ingolstadt", "Würzburg", "Fürth", "Erlangen", "Bamberg", "Bayreuth", "Landshut", "Aschaffenburg", "Kempten", "Rosenheim", "Neu-Ulm", "Schweinfurt", "Passau", "Freising", "Straubing", "Dachau"],
    "Berlin": ["Berlin"],
    "Brandenburg": ["Potsdam", "Cottbus", "Brandenburg an der Havel", "Frankfurt (Oder)", "Oranienburg", "Falkensee", "Bernau bei Berlin", "Eberswalde", "Königs Wusterhausen", "Fürstenwalde", "Neuruppin", "Schwedt", "Hohen Neuendorf", "Strausberg", "Teltow", "Hennigsdorf", "Werder", "Ludwigsfelde", "Senftenberg", "Spremberg"],
    "Bremen": ["Bremen", "Bremerhaven"],
    "Hamburg": ["Hamburg"],
    "Hesse": ["Frankfurt", "Wiesbaden", "Kassel", "Darmstadt", "Offenbach", "Hanau", "Gießen", "Marburg", "Fulda", "Rüsselsheim", "Wetzlar", "Bad Homburg", "Oberursel", "Rodgau", "Bensheim", "Dreieich", "Hofheim", "Maintal", "Neu-Isenburg", "Viernheim"],
    "Lower Saxony": ["Hanover", "Braunschweig", "Oldenburg", "Osnabrück", "Wolfsburg", "Göttingen", "Salzgitter", "Hildesheim", "Wilhelmshaven", "Delmenhorst", "Celle", "Lüneburg", "Lingen", "Hameln", "Nordhorn", "Emden", "Wolfenbüttel", "Cuxhaven", "Garbsen", "Peine"],
    "Mecklenburg-Vorpommern": ["Rostock", "Schwerin", "Neubrandenburg", "Stralsund", "Greifswald", "Wismar", "Güstrow", "Waren", "Neustrelitz", "Pasewalk", "Bergen auf Rügen", "Ribnitz-Damgarten", "Ludwigslust", "Bad Doberan", "Wolgast", "Anklam", "Demmin", "Parchim", "Grevesmühlen", "Hagenow"],
    "North Rhine-Westphalia": ["Cologne", "Düsseldorf", "Dortmund", "Essen", "Duisburg", "Bochum", "Wuppertal", "Bielefeld", "Bonn", "Münster", "Gelsenkirchen", "Mönchengladbach", "Aachen", "Krefeld", "Oberhausen", "Hagen", "Hamm", "Mülheim", "Leverkusen", "Solingen"],
    "Rhineland-Palatinate": ["Mainz", "Ludwigshafen", "Koblenz", "Trier", "Kaiserslautern", "Worms", "Neuwied", "Neustadt an der Weinstraße", "Speyer", "Bad Kreuznach", "Landau", "Pirmasens", "Frankenthal", "Zweibrücken", "Bingen", "Andernach", "Ingelheim", "Idar-Oberstein", "Mayen", "Bad Neuenahr-Ahrweiler"],
    "Saarland": ["Saarbrücken", "Neunkirchen", "Homburg", "Völklingen", "Sankt Ingbert", "Saarlouis", "Merzig", "Sankt Wendel", "Dillingen", "Blieskastel", "Sulzbach", "Schmelz", "Heusweiler", "Püttlingen", "Bexbach", "Lebach", "Friedrichsthal", "Eppelborn", "Wadern", "Mettlach"],
    "Saxony": ["Leipzig", "Dresden", "Chemnitz", "Zwickau", "Plauen", "Görlitz", "Freiberg", "Bautzen", "Pirna", "Freital", "Radebeul", "Meissen", "Riesa", "Limbach-Oberfrohna", "Glauchau", "Markkleeberg", "Döbeln", "Annaberg-Buchholz", "Delitzsch", "Hoyerswerda"],
    "Saxony-Anhalt": ["Halle", "Magdeburg", "Dessau-Roßlau", "Wittenberg", "Stendal", "Halberstadt", "Wernigerode", "Bernburg", "Weißenfels", "Merseburg", "Quedlinburg", "Schönebeck", "Sangerhausen", "Aschersleben", "Naumburg", "Köthen", "Zeitz", "Staßfurt", "Burg", "Bitterfeld-Wolfen"],
    "Schleswig-Holstein": ["Kiel", "Lübeck", "Flensburg", "Neumünster", "Norderstedt", "Elmshorn", "Pinneberg", "Wedel", "Ahrensburg", "Itzehoe", "Geesthacht", "Rendsburg", "Henstedt-Ulzburg", "Reinbek", "Bad Oldesloe", "Husum", "Schleswig", "Heide", "Kaltenkirchen", "Quickborn"],
    "Thuringia": ["Erfurt", "Jena", "Gera", "Weimar", "Gotha", "Nordhausen", "Eisenach", "Suhl", "Altenburg", "Mühlhausen", "Ilmenau", "Arnstadt", "Apolda", "Rudolstadt", "Sondershausen", "Meiningen", "Sonneberg", "Saalfeld", "Greiz", "Schmalkalden"],
  },
};

// Italian regions and cities
const ITALY_DATA = {
  provinces: [
    { code: "PIE", name: "Piedmont", name_local: "Piemonte" },
    { code: "VDA", name: "Aosta Valley", name_local: "Valle d'Aosta" },
    { code: "LOM", name: "Lombardy", name_local: "Lombardia" },
    { code: "TAA", name: "Trentino-Alto Adige", name_local: "Trentino-Alto Adige" },
    { code: "VEN", name: "Veneto", name_local: "Veneto" },
    { code: "FVG", name: "Friuli Venezia Giulia", name_local: "Friuli Venezia Giulia" },
    { code: "LIG", name: "Liguria", name_local: "Liguria" },
    { code: "EMR", name: "Emilia-Romagna", name_local: "Emilia-Romagna" },
    { code: "TOS", name: "Tuscany", name_local: "Toscana" },
    { code: "UMB", name: "Umbria", name_local: "Umbria" },
    { code: "MAR", name: "Marche", name_local: "Marche" },
    { code: "LAZ", name: "Lazio", name_local: "Lazio" },
    { code: "ABR", name: "Abruzzo", name_local: "Abruzzo" },
    { code: "MOL", name: "Molise", name_local: "Molise" },
    { code: "CAM", name: "Campania", name_local: "Campania" },
    { code: "PUG", name: "Puglia", name_local: "Puglia" },
    { code: "BAS", name: "Basilicata", name_local: "Basilicata" },
    { code: "CAL", name: "Calabria", name_local: "Calabria" },
    { code: "SIC", name: "Sicily", name_local: "Sicilia" },
    { code: "SAR", name: "Sardinia", name_local: "Sardegna" },
  ],
  cities: {
    "Piedmont": ["Turin", "Novara", "Alessandria", "Asti", "Cuneo", "Moncalieri", "Collegno", "Rivoli", "Nichelino", "Settimo Torinese", "Biella", "Vercelli", "Grugliasco", "Chieri", "Casale Monferrato", "Pinerolo", "Venaria Reale", "Verbania", "Alba", "Bra"],
    "Aosta Valley": ["Aosta", "Saint-Vincent", "Châtillon", "Sarre", "Pont-Saint-Martin", "Quart", "Gressan", "Saint-Christophe", "Courmayeur", "Verrès"],
    "Lombardy": ["Milan", "Brescia", "Bergamo", "Monza", "Como", "Varese", "Busto Arsizio", "Sesto San Giovanni", "Cinisello Balsamo", "Pavia", "Cremona", "Mantua", "Legnano", "Gallarate", "Rho", "Vigevano", "Lecco", "Cologno Monzese", "Paderno Dugnano", "Saronno"],
    "Trentino-Alto Adige": ["Trento", "Bolzano", "Merano", "Rovereto", "Bressanone", "Laives", "Pergine Valsugana", "Brunico", "Arco", "Riva del Garda"],
    "Veneto": ["Venice", "Verona", "Padua", "Vicenza", "Treviso", "Rovigo", "Chioggia", "Bassano del Grappa", "San Donà di Piave", "Schio", "Mestre", "Conegliano", "Castelfranco Veneto", "Montebelluna", "Mira", "Jesolo", "Villafranca di Verona", "Spinea", "Thiene", "Valdagno"],
    "Friuli Venezia Giulia": ["Trieste", "Udine", "Pordenone", "Gorizia", "Monfalcone", "Sacile", "Cividale del Friuli", "Codroipo", "Cordenons", "Lignano Sabbiadoro"],
    "Liguria": ["Genoa", "La Spezia", "Savona", "Sanremo", "Imperia", "Rapallo", "Chiavari", "Albenga", "Sestri Levante", "Ventimiglia"],
    "Emilia-Romagna": ["Bologna", "Parma", "Modena", "Reggio Emilia", "Ravenna", "Rimini", "Ferrara", "Forlì", "Piacenza", "Cesena", "Carpi", "Imola", "Faenza", "Casalecchio di Reno", "Sassuolo", "Fidenza", "Cervia", "Riccione", "Correggio", "San Lazzaro di Savena"],
    "Tuscany": ["Florence", "Prato", "Livorno", "Arezzo", "Pisa", "Lucca", "Pistoia", "Siena", "Massa", "Carrara", "Grosseto", "Viareggio", "Scandicci", "Empoli", "Campi Bisenzio", "Sesto Fiorentino", "Capannori", "Cascina", "Pontedera", "Cecina"],
    "Umbria": ["Perugia", "Terni", "Foligno", "Città di Castello", "Spoleto", "Gubbio", "Assisi", "Orvieto", "Corciano", "Narni"],
    "Marche": ["Ancona", "Pesaro", "Fano", "Ascoli Piceno", "Macerata", "Senigallia", "Civitanova Marche", "Jesi", "Fermo", "San Benedetto del Tronto"],
    "Lazio": ["Rome", "Latina", "Guidonia Montecelio", "Fiumicino", "Aprilia", "Viterbo", "Pomezia", "Tivoli", "Velletri", "Anzio", "Civitavecchia", "Nettuno", "Ardea", "Frosinone", "Terracina", "Rieti", "Cerveteri", "Ciampino", "Fonte Nuova", "Ladispoli"],
    "Abruzzo": ["Pescara", "L'Aquila", "Teramo", "Chieti", "Montesilvano", "Avezzano", "Lanciano", "Vasto", "Sulmona", "Francavilla al Mare"],
    "Molise": ["Campobasso", "Termoli", "Isernia", "Venafro", "Larino", "Bojano", "Agnone", "Campomarino", "Guglionesi", "Montenero di Bisaccia"],
    "Campania": ["Naples", "Salerno", "Giugliano in Campania", "Torre del Greco", "Pozzuoli", "Casoria", "Caserta", "Castellammare di Stabia", "Afragola", "Marano di Napoli", "Portici", "Ercolano", "Aversa", "Acerra", "Benevento", "Scafati", "Cava de' Tirreni", "Torre Annunziata", "Nocera Inferiore", "Battipaglia"],
    "Puglia": ["Bari", "Taranto", "Foggia", "Lecce", "Andria", "Barletta", "Brindisi", "Altamura", "Molfetta", "San Severo", "Cerignola", "Trani", "Bitonto", "Monopoli", "Manfredonia", "Bisceglie", "Corato", "Martina Franca", "Lucera", "Fasano"],
    "Basilicata": ["Potenza", "Matera", "Melfi", "Pisticci", "Policoro", "Lauria", "Rionero in Vulture", "Venosa", "Lavello", "Bernalda"],
    "Calabria": ["Reggio Calabria", "Catanzaro", "Lamezia Terme", "Cosenza", "Crotone", "Vibo Valentia", "Rende", "Corigliano-Rossano", "Castrovillari", "Palmi"],
    "Sicily": ["Palermo", "Catania", "Messina", "Syracuse", "Ragusa", "Marsala", "Gela", "Trapani", "Vittoria", "Caltanissetta", "Agrigento", "Bagheria", "Modica", "Acireale", "Mazara del Vallo", "Misterbianco", "Enna", "Barcellona Pozzo di Gotto", "Sciacca", "Paternò"],
    "Sardinia": ["Cagliari", "Sassari", "Quartu Sant'Elena", "Olbia", "Alghero", "Nuoro", "Oristano", "Carbonia", "Selargius", "Iglesias"],
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const results = {
      countries: 0,
      provinces: 0,
      cities: 0,
      errors: [] as string[],
    };

    console.log("Starting geography population...");

    // 1. Insert countries
    for (const country of EUROPEAN_COUNTRIES) {
      const { error } = await supabase
        .from("geography_countries")
        .upsert(country, { onConflict: "code" });

      if (error) {
        results.errors.push(`Country ${country.name}: ${error.message}`);
      } else {
        results.countries++;
      }
    }
    console.log(`Inserted ${results.countries} countries`);

    // 2. Insert Spain data
    for (const province of SPAIN_DATA.provinces) {
      const { data: insertedProvince, error: provError } = await supabase
        .from("geography_provinces")
        .upsert(
          { ...province, country_code: "ES" },
          { onConflict: "country_code,name" }
        )
        .select("id")
        .single();

      if (provError) {
        results.errors.push(`ES Province ${province.name}: ${provError.message}`);
        continue;
      }

      results.provinces++;
      const provinceId = insertedProvince.id;
      const cities = SPAIN_DATA.cities[province.name as keyof typeof SPAIN_DATA.cities] || [];

      for (const cityName of cities) {
        const { error: cityError } = await supabase
          .from("geography_cities")
          .upsert(
            { province_id: provinceId, name: cityName },
            { onConflict: "province_id,name" }
          );

        if (cityError) {
          results.errors.push(`ES City ${cityName}: ${cityError.message}`);
        } else {
          results.cities++;
        }
      }
    }
    console.log(`Inserted Spain provinces and cities`);

    // 3. Insert France data
    for (const province of FRANCE_DATA.provinces) {
      const { data: insertedProvince, error: provError } = await supabase
        .from("geography_provinces")
        .upsert(
          { ...province, country_code: "FR" },
          { onConflict: "country_code,name" }
        )
        .select("id")
        .single();

      if (provError) {
        results.errors.push(`FR Province ${province.name}: ${provError.message}`);
        continue;
      }

      results.provinces++;
      const provinceId = insertedProvince.id;
      const cities = FRANCE_DATA.cities[province.name as keyof typeof FRANCE_DATA.cities] || [];

      for (const cityName of cities) {
        const { error: cityError } = await supabase
          .from("geography_cities")
          .upsert(
            { province_id: provinceId, name: cityName },
            { onConflict: "province_id,name" }
          );

        if (cityError) {
          results.errors.push(`FR City ${cityName}: ${cityError.message}`);
        } else {
          results.cities++;
        }
      }
    }
    console.log(`Inserted France provinces and cities`);

    // 4. Insert Germany data
    for (const province of GERMANY_DATA.provinces) {
      const { data: insertedProvince, error: provError } = await supabase
        .from("geography_provinces")
        .upsert(
          { ...province, country_code: "DE" },
          { onConflict: "country_code,name" }
        )
        .select("id")
        .single();

      if (provError) {
        results.errors.push(`DE Province ${province.name}: ${provError.message}`);
        continue;
      }

      results.provinces++;
      const provinceId = insertedProvince.id;
      const cities = GERMANY_DATA.cities[province.name as keyof typeof GERMANY_DATA.cities] || [];

      for (const cityName of cities) {
        const { error: cityError } = await supabase
          .from("geography_cities")
          .upsert(
            { province_id: provinceId, name: cityName },
            { onConflict: "province_id,name" }
          );

        if (cityError) {
          results.errors.push(`DE City ${cityName}: ${cityError.message}`);
        } else {
          results.cities++;
        }
      }
    }
    console.log(`Inserted Germany provinces and cities`);

    // 5. Insert Italy data
    for (const province of ITALY_DATA.provinces) {
      const { data: insertedProvince, error: provError } = await supabase
        .from("geography_provinces")
        .upsert(
          { ...province, country_code: "IT" },
          { onConflict: "country_code,name" }
        )
        .select("id")
        .single();

      if (provError) {
        results.errors.push(`IT Province ${province.name}: ${provError.message}`);
        continue;
      }

      results.provinces++;
      const provinceId = insertedProvince.id;
      const cities = ITALY_DATA.cities[province.name as keyof typeof ITALY_DATA.cities] || [];

      for (const cityName of cities) {
        const { error: cityError } = await supabase
          .from("geography_cities")
          .upsert(
            { province_id: provinceId, name: cityName },
            { onConflict: "province_id,name" }
          );

        if (cityError) {
          results.errors.push(`IT City ${cityName}: ${cityError.message}`);
        } else {
          results.cities++;
        }
      }
    }
    console.log(`Inserted Italy provinces and cities`);

    console.log("Geography population complete:", results);

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error populating geography:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
