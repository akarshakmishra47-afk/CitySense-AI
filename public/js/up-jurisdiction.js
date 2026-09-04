/**
 * UP Jurisdiction Data for Citizen Portal
 * Maps all 75 districts of Uttar Pradesh to their respective:
 * - Municipal Corporations (Nagar Nigam)
 * - Municipal Councils (Nagar Palika Parishad)
 * - Town Councils (Nagar Panchayat)
 */

const UP_JURISDICTION_DATA = {
  "Agra": {
    "municipalCorporations": ["Agra Municipal Corporation"],
    "municipalCouncils": ["Achhnera Municipal Council", "Bah Municipal Council", "Fatehpur Sikri Municipal Council", "Shamsabad Municipal Council"],
    "townCouncils": ["Dayalbagh Town Council", "Etmadpur Town Council", "Fatehabad Town Council", "Jagner Town Council", "Kheragarh Town Council", "Pinahat Town Council", "Swamibagh Town Council"]
  },
  "Aligarh": {
    "municipalCorporations": ["Aligarh Municipal Corporation"],
    "municipalCouncils": ["Atrauli Municipal Council", "Khair Municipal Council"],
    "townCouncils": ["Beswan Town Council", "Chharra Town Council", "Harduaganj Town Council", "Iglas Town Council", "Jalalpur Town Council", "Jatari Town Council", "Kauriyaganj Town Council", "Pilkhana Town Council", "Vijaigarh Town Council"]
  },
  "Ambedkar Nagar": {
    "municipalCorporations": [],
    "municipalCouncils": ["Akbarpur Municipal Council", "Jalalpur Municipal Council", "Tanda Municipal Council"],
    "townCouncils": ["Ashrafpur Kichhauchha Town Council", "Bhiti Town Council", "Iltifatganj Town Council", "Jahangirganj Town Council", "Rajesultanpur Town Council"]
  },
  "Amethi": {
    "municipalCorporations": [],
    "municipalCouncils": ["Gauriganj Municipal Council", "Jais Municipal Council"],
    "townCouncils": ["Amethi Town Council", "Musafirkhana Town Council"]
  },
  "Amroha": {
    "municipalCorporations": [],
    "municipalCouncils": ["Amroha Municipal Council", "Bachhraon Municipal Council", "Dhanaura Municipal Council", "Gajraula Municipal Council", "Hasanpur Municipal Council"],
    "townCouncils": ["Joya Town Council", "Naugawan Sadat Town Council", "Ujhary Town Council"]
  },
  "Auraiya": {
    "municipalCorporations": [],
    "municipalCouncils": ["Auraiya Municipal Council", "Dibiyapur Municipal Council"],
    "townCouncils": ["Achhalda Town Council", "Ajitmal Town Council", "Atsoo Town Council", "Babarpur Ajitmal Town Council", "Bidhuna Town Council", "Phaphund Town Council"]
  },
  "Ayodhya": {
    "municipalCorporations": ["Ayodhya Municipal Corporation"],
    "municipalCouncils": ["Rudauli Municipal Council"],
    "townCouncils": ["Bhadarsa Town Council", "Bikapur Town Council", "Goshainganj Town Council", "Khandasa Town Council"]
  },
  "Azamgarh": {
    "municipalCorporations": [],
    "municipalCouncils": ["Azamgarh Municipal Council", "Bilariaganj Municipal Council", "Mubarakpur Municipal Council"],
    "townCouncils": ["Amilo Town Council", "Atraulia Town Council", "Azmatgarh Town Council", "Hafizpur Town Council", "Jiyanpur Town Council", "Katghar Lalganj Town Council", "Mahrajganj Town Council", "Mehnagar Town Council", "Nizamabad Town Council", "Phulpur Town Council", "Sarai Mir Town Council"]
  },
  "Badaun": {
    "municipalCorporations": [],
    "municipalCouncils": ["Badaun Municipal Council", "Bilsi Municipal Council", "Bisauli Municipal Council", "Dataganj Municipal Council", "Kakrala Municipal Council", "Sahaswan Municipal Council", "Ujhani Municipal Council"],
    "townCouncils": ["Alapur Town Council", "Faizganj Town Council", "Gulariya Town Council", "Gunnaur Town Council", "Islamnagar Town Council", "Kachhla Town Council", "Kunwargaon Town Council", "Mundia Town Council", "Rehar Town Council", "Rudayan Town Council", "Saidpur Town Council", "Sakhanu Town Council", "Samrer Town Council", "Usawan Town Council", "Usehat Town Council", "Wazirganj Town Council"]
  },
  "Baghpat": {
    "municipalCorporations": [],
    "municipalCouncils": ["Baghpat Municipal Council", "Baraut Municipal Council", "Khekada Municipal Council"],
    "townCouncils": ["Agarwal Mandi Town Council", "Aminagar Sarai Town Council", "Chhaprauli Town Council", "Doghat Town Council", "Tikri Town Council"]
  },
  "Bahraich": {
    "municipalCorporations": [],
    "municipalCouncils": ["Bahraich Municipal Council", "Nanpara Municipal Council"],
    "townCouncils": ["Jarwal Town Council", "Payagpur Town Council", "Risia Bazar Town Council"]
  },
  "Ballia": {
    "municipalCorporations": [],
    "municipalCouncils": ["Ballia Municipal Council", "Rasra Municipal Council"],
    "townCouncils": ["Bansdih Town Council", "Belthara Road Town Council", "Chitbara Gaon Town Council", "Maniyar Town Council", "Reoti Town Council", "Sahatwar Town Council", "Sikanderpur Town Council"]
  },
  "Balrampur": {
    "municipalCorporations": [],
    "municipalCouncils": ["Balrampur Municipal Council", "Utraula Municipal Council"],
    "townCouncils": ["Gasari Town Council", "Pachperwa Town Council", "Tulsipur Town Council"]
  },
  "Banda": {
    "municipalCorporations": [],
    "municipalCouncils": ["Atarra Municipal Council", "Banda Municipal Council"],
    "townCouncils": ["Baberu Town Council", "Bisanda Buzurg Town Council", "Mataundh Town Council", "Naraini Town Council", "Oran Town Council", "Tindwari Town Council"]
  },
  "Barabanki": {
    "municipalCorporations": [],
    "municipalCouncils": ["Nawabganj (Barabanki) Municipal Council"],
    "townCouncils": ["Banki Town Council", "Daryabad Town Council", "Fatehpur Town Council", "Haidergarh Town Council", "Masauli Town Council", "Ramnagar Town Council", "Satrikh Town Council", "Siddhaur Town Council", "Tikait Nagar Town Council", "Zaidpur Town Council"]
  },
  "Bareilly": {
    "municipalCorporations": ["Bareilly Municipal Corporation"],
    "municipalCouncils": ["Aonla Municipal Council", "Baheri Municipal Council", "Faridpur Municipal Council", "Nawabganj Municipal Council"],
    "townCouncils": ["Bhojipura Town Council", "Bisharatganj Town Council", "Deoranian Town Council", "Dhaura Tanda Town Council", "Fatehganj Pashchimi Town Council", "Fatehganj Purbi Town Council", "Kakgrah Town Council", "Mirganj Town Council", "Pipalsana Chaudhari Town Council", "Richha Town Council", "Rithora Town Council", "Sainthal Town Council", "Shahi Town Council", "Shergarh Town Council", "Shishgarh Town Council", "Sirauli Town Council"]
  },
  "Basti": {
    "municipalCorporations": [],
    "municipalCouncils": ["Basti Municipal Council"],
    "townCouncils": ["Babhnan Bazar Town Council", "Bankati Town Council", "Bhanpur Town Council", "Gaur Town Council", "Harraiya Town Council", "Kaptanganj Town Council", "Munderwa Town Council", "Rudhauli Town Council"]
  },
  "Bhadohi": {
    "municipalCorporations": [],
    "municipalCouncils": ["Bhadohi Municipal Council", "Gopiganj Municipal Council"],
    "townCouncils": ["Ghosia Bazar Town Council", "Gyanpur Town Council", "Khamaria Town Council", "Nai Bazar Town Council", "Suriyawan Town Council"]
  },
  "Bijnor": {
    "municipalCorporations": [],
    "municipalCouncils": ["Afzalgarh Municipal Council", "Bijnor Municipal Council", "Chandpur Municipal Council", "Dhampur Municipal Council", "Kiratpur Municipal Council", "Nagina Municipal Council", "Najibabad Municipal Council", "Noorpur Municipal Council", "Seohara Municipal Council", "Sherkot Municipal Council", "Syohara Municipal Council"],
    "townCouncils": ["Haldaur Town Council", "Jhalu Town Council", "Mandawar Town Council", "Mukrampur Khema Town Council", "Nehtaur Town Council", "Rashidpur Garhi Town Council", "Sahanpur Town Council", "Sahaspur Town Council", "Tajpur Town Council", "Warhapur Town Council"]
  },
  "Bulandshahr": {
    "municipalCorporations": [],
    "municipalCouncils": ["Anupshahr Municipal Council", "Bulandshahr Municipal Council", "Debai Municipal Council", "Gulaothi Municipal Council", "Jahangirabad Municipal Council", "Khurja Municipal Council", "Shikarpur Municipal Council", "Siana Municipal Council", "Sikandrabad Municipal Council"],
    "townCouncils": ["Aurangabad Town Council", "Bhawan Bahadur Nagar Town Council", "Bugrasi Town Council", "Chhatari Town Council", "Kakod Town Council", "Khanpur Town Council", "Narsena Town Council", "Pahasu Town Council", "Rabupura Town Council", "Shikarpur Dehat Town Council"]
  },
  "Chandauli": {
    "municipalCorporations": [],
    "municipalCouncils": ["Mughalsarai (Pt. Deen Dayal Upadhyaya) Municipal Council"],
    "townCouncils": ["Chandauli Town Council", "Chakia Town Council", "Saiyad Raja Town Council"]
  },
  "Chitrakoot": {
    "municipalCorporations": [],
    "municipalCouncils": ["Chitrakoot Dham (Karwi) Municipal Council"],
    "townCouncils": ["Manikpur Sarhat Town Council", "Rajapur Town Council"]
  },
  "Deoria": {
    "municipalCorporations": [],
    "municipalCouncils": ["Deoria Municipal Council", "Gaura Barhaj Municipal Council"],
    "townCouncils": ["Baitalpur Town Council", "Bhatni Bazar Town Council", "Bhatpar Rani Town Council", "Gauri Bazar Town Council", "Lar Town Council", "Majhauli Raj Town Council", "Patherdeva Town Council", "Rampur Karkhana Town Council", "Rudrapur Town Council", "Salempur Town Council", "Tarkulwa Town Council"]
  },
  "Etah": {
    "municipalCorporations": [],
    "municipalCouncils": ["Aliganj Municipal Council", "Etah Municipal Council", "Jalesar Municipal Council", "Marhara Municipal Council"],
    "townCouncils": ["Awagarh Town Council", "Bhargain Town Council", "Jaithara Town Council", "Nidhauli Kalan Town Council", "Raja Ka Rampur Town Council", "Sakit Town Council"]
  },
  "Etawah": {
    "municipalCorporations": [],
    "municipalCouncils": ["Bharthana Municipal Council", "Etawah Municipal Council", "Jaswantnagar Municipal Council"],
    "townCouncils": ["Bakewar Town Council", "Ekdil Town Council", "Lakhna Town Council", "Saifai Town Council"]
  },
  "Farrukhabad": {
    "municipalCorporations": [],
    "municipalCouncils": ["Farrukhabad-cum-Fatehgarh Municipal Council", "Kaimganj Municipal Council"],
    "townCouncils": ["Amritpur Town Council", "Kamalganj Town Council", "Mohammadabad Town Council", "Nawabganj Town Council", "Shamsabad Town Council"]
  },
  "Fatehpur": {
    "municipalCorporations": [],
    "municipalCouncils": ["Bindki Municipal Council", "Fatehpur Municipal Council"],
    "townCouncils": ["Bahua Town Council", "Bakewar Town Council", "Hathgam Town Council", "Khaga Town Council", "Koraon Town Council", "Kishanpur Town Council"]
  },
  "Firozabad": {
    "municipalCorporations": ["Firozabad Municipal Corporation"],
    "municipalCouncils": ["Shikohabad Municipal Council", "Sirsaganj Municipal Council", "Tundla Municipal Council"],
    "townCouncils": ["Fariha Town Council", "Jasrana Town Council", "Makkhanpur Town Council"]
  },
  "Gautam Buddha Nagar": {
    "municipalCorporations": [],
    "municipalCouncils": ["Dadri Municipal Council"],
    "townCouncils": ["Bilaspur Town Council", "Dankaur Town Council", "Jahangirpur Town Council", "Jewar Town Council", "Rabupura Town Council"]
  },
  "Ghaziabad": {
    "municipalCorporations": ["Ghaziabad Municipal Corporation"],
    "municipalCouncils": ["Loni Municipal Council", "Modinagar Municipal Council", "Muradnagar Municipal Council"],
    "townCouncils": ["Dasna Town Council", "Niwari Town Council", "Patla Town Council"]
  },
  "Ghazipur": {
    "municipalCorporations": [],
    "municipalCouncils": ["Ghazipur Municipal Council", "Mohammadabad Municipal Council", "Zamania Municipal Council"],
    "townCouncils": ["Bahadurganj Town Council", "Dildarnagar Town Council", "Jangipur Town Council", "Sadat Town Council", "Saidpur Town Council"]
  },
  "Gonda": {
    "municipalCorporations": [],
    "municipalCouncils": ["Colonelganj Municipal Council", "Gonda Municipal Council", "Nawabganj Municipal Council"],
    "townCouncils": ["Dhanepur Town Council", "Katra Bazar Town Council", "Kharagupur Town Council", "Mankapur Town Council", "Paraspur Town Council", "Tarabganj Town Council"]
  },
  "Gorakhpur": {
    "municipalCorporations": ["Gorakhpur Municipal Corporation"],
    "municipalCouncils": ["Barhalganj Municipal Council"],
    "townCouncils": ["Bansgaon Town Council", "Gola Bazar Town Council", "Mundera Bazar Town Council", "Pipiganj Town Council", "Pipraich Town Council", "Sahjanwa Town Council", "Unwal Town Council"]
  },
  "Hamirpur": {
    "municipalCorporations": [],
    "municipalCouncils": ["Hamirpur Municipal Council", "Maudaha Municipal Council", "Rath Municipal Council"],
    "townCouncils": ["Gohand Town Council", "Kurara Town Council", "Sarila Town Council", "Sumerpur Town Council"]
  },
  "Hapur": {
    "municipalCorporations": [],
    "municipalCouncils": ["Garhmukteshwar Municipal Council", "Hapur Municipal Council", "Pilkhuwa Municipal Council"],
    "townCouncils": ["Babu Garh Town Council"]
  },
  "Hardoi": {
    "municipalCorporations": [],
    "municipalCouncils": [
      "Hardoi Municipal Council",
      "Bilgram Municipal Council",
      "Mallawan Municipal Council",
      "Pihani Municipal Council",
      "Sandi Municipal Council",
      "Sandila Municipal Council",
      "Shahabad Municipal Council"
    ],
    "townCouncils": [
      "Beniganj Town Council",
      "Gopamau Town Council",
      "Kachhauna Patseni Town Council",
      "Kursath Town Council",
      "Madhoganj Town Council",
      "Pali Town Council",
      "Somwanshi Town Council"
    ]
  },
  "Hathras": {
    "municipalCorporations": [],
    "municipalCouncils": ["Hathras Municipal Council", "Sikandra Rao Municipal Council"],
    "townCouncils": ["Hasayan Town Council", "Mendu Town Council", "Mursan Town Council", "Purdilnagar Town Council", "Sadabad Town Council", "Sahpau Town Council", "Sasni Town Council"]
  },
  "Jalaun": {
    "municipalCorporations": [],
    "municipalCouncils": ["Jalaun Municipal Council", "Kalpi Municipal Council", "Konch Municipal Council", "Orai Municipal Council"],
    "townCouncils": ["Kadaura Town Council", "Kotra Town Council", "Madhogarh Town Council", "Nadigaon Town Council", "Rampur Town Council", "Umri Town Council"]
  },
  "Jaunpur": {
    "municipalCorporations": [],
    "municipalCouncils": ["Jaunpur Municipal Council", "Mahuva (Mughal) Municipal Council", "Shahganj Municipal Council"],
    "townCouncils": ["Badlapur Town Council", "Jafarabad Town Council", "Kerakat Town Council", "Kheta Sarai Town Council", "Machhlishahr Town Council", "Mariyahu Town Council", "Mogra Badshahpur Town Council"]
  },
  "Jhansi": {
    "municipalCorporations": ["Jhansi Municipal Corporation"],
    "municipalCouncils": ["Barua Sagar Municipal Council", "Chirgaon Municipal Council", "Gursarai Municipal Council", "Mauranipur Municipal Council", "Samthar Municipal Council"],
    "townCouncils": ["Babina Town Council", "Bada Gaon Town Council", "Erich Town Council", "Garautha Town Council", "Kathera Town Council", "Moth Town Council", "Ranipur Town Council", "Todi Fatehpur Town Council"]
  },
  "Kannauj": {
    "municipalCorporations": [],
    "municipalCouncils": ["Chhibramau Municipal Council", "Gursahaiganj Municipal Council", "Kannauj Municipal Council"],
    "townCouncils": ["Samdhan Town Council", "Saurikh Town Council", "Talgram Town Council", "Tirwa Town Council"]
  },
  "Kanpur Dehat": {
    "municipalCorporations": [],
    "municipalCouncils": ["Jhinjhak Municipal Council", "Pukhrayan Municipal Council"],
    "townCouncils": ["Akbarpur Town Council", "Amruthpur Town Council", "Derapur Town Council", "Rura Town Council", "Rasoolabad Town Council", "Sikandra Town Council", "Shivli Town Council"]
  },
  "Kanpur Nagar": {
    "municipalCorporations": ["Kanpur Municipal Corporation"],
    "municipalCouncils": ["Bilhaur Municipal Council", "Ghatampur Municipal Council"],
    "townCouncils": ["Bithoor Town Council", "Chakeri Town Council", "Shivrajpur Town Council"]
  },
  "Kasganj": {
    "municipalCorporations": [],
    "municipalCouncils": ["Ganjdundwara Municipal Council", "Kasganj Municipal Council", "Soron Municipal Council"],
    "townCouncils": ["Bilram Town Council", "Mohanpur Town Council", "Patiyali Town Council", "Sahawar Town Council", "Sidhpura Town Council"]
  },
  "Kaushambi": {
    "municipalCorporations": [],
    "municipalCouncils": ["Bharwari Municipal Council", "Manjhanpur Municipal Council"],
    "townCouncils": ["Ajhuwa Town Council", "Chail Town Council", "Karari Town Council", "Sarai Aquil Town Council", "Sirathu Town Council"]
  },
  "Kheri": {
    "municipalCorporations": [],
    "municipalCouncils": ["Gola Gokarannath Municipal Council", "Lakhimpur Municipal Council", "Mohammadi Municipal Council", "Palia Kalan Municipal Council"],
    "townCouncils": ["Barwar Town Council", "Dhaurehra Town Council", "Kheri Town Council", "Mailani Town Council", "Oel Dhakwa Town Council", "Singahi Bhiraura Town Council"]
  },
  "Kushinagar": {
    "municipalCorporations": [],
    "municipalCouncils": ["Hata Municipal Council", "Kushinagar Municipal Council", "Padrauna Municipal Council"],
    "townCouncils": ["Captainganj Town Council", "Fazilnagar Town Council", "Khadda Town Council", "Kasia Town Council", "Mathauli Town Council", "Ramkola Town Council", "Seorahi Town Council", "Sukrauli Town Council"]
  },
  "Lalitpur": {
    "municipalCorporations": [],
    "municipalCouncils": ["Lalitpur Municipal Council"],
    "townCouncils": ["Mahroni Town Council", "Pali Town Council", "Talbehat Town Council"]
  },
  "Lucknow": {
    "municipalCorporations": ["Lucknow Municipal Corporation"],
    "municipalCouncils": [],
    "townCouncils": ["Amethi Town Council", "Bakshi Ka Talab Town Council", "Gosainganj Town Council", "Itaunja Town Council", "Kakori Town Council", "Mahona Town Council", "Malihabad Town Council", "Nagram Town Council"]
  },
  "Maharajganj": {
    "municipalCorporations": [],
    "municipalCouncils": ["Maharajganj Municipal Council", "Nautanwa Municipal Council"],
    "townCouncils": ["Anandnagar (Pharenda) Town Council", "Brijmanganj Town Council", "Chowk Bazar Town Council", "Ghughli Town Council", "Nichlaul Town Council", "Siswa Bazar Town Council"]
  },
  "Mahoba": {
    "municipalCorporations": [],
    "municipalCouncils": ["Charkhari Municipal Council", "Mahoba Municipal Council"],
    "townCouncils": ["Kabrai Town Council", "Kharela Town Council", "Kulpahar Town Council"]
  },
  "Mainpuri": {
    "municipalCorporations": [],
    "municipalCouncils": ["Mainpuri Municipal Council", "Shikohabad Dehat Municipal Council"],
    "townCouncils": ["Begaum Town Council", "Bhongaon Town Council", "Ghiror Town Council", "Karhal Town Council", "Kishni Town Council", "Kuraoli Town Council", "Kusmara Town Council", "Sultanganj Town Council"]
  },
  "Mathura": {
    "municipalCorporations": ["Mathura-Vrindavan Municipal Corporation"],
    "municipalCouncils": ["Kosi Kalan Municipal Council"],
    "townCouncils": ["Baldeo Town Council", "Barsana Town Council", "Chaumuhan Town Council", "Chhata Town Council", "Farah Town Council", "Gokul Town Council", "Goverdhan Town Council", "Mahaban Town Council", "Nandgaon Town Council", "Radhakund Town Council", "Raya Town Council", "Saunkh Town Council"]
  },
  "Mau": {
    "municipalCorporations": [],
    "municipalCouncils": ["Maunath Bhanjan Municipal Council"],
    "townCouncils": ["Adari Town Council", "Amila Town Council", "Doharighat Town Council", "Ghosi Town Council", "Kopaganj Town Council", "Kurthi Jafarpur Town Council", "Muhammadabad Gohna Town Council", "Walidpur Town Council"]
  },
  "Meerut": {
    "municipalCorporations": ["Meerut Municipal Corporation"],
    "municipalCouncils": ["Mawana Municipal Council", "Sardhana Municipal Council"],
    "townCouncils": ["Bahsuma Town Council", "Daurala Town Council", "Hastinapur Town Council", "Karnawal Town Council", "Kharkhoda Town Council", "Kithore Town Council", "Lawar Town Council", "Parikshitgarh Town Council", "Phalauda Town Council", "Sewalkhas Town Council", "Shahjahanpur Town Council"]
  },
  "Mirzapur": {
    "municipalCorporations": [],
    "municipalCouncils": ["Ahraura Municipal Council", "Chunar Municipal Council", "Mirzapur-cum-Vindhyachal Municipal Council"],
    "townCouncils": ["Kachhwa Town Council"]
  },
  "Moradabad": {
    "municipalCorporations": ["Moradabad Municipal Corporation"],
    "municipalCouncils": ["Bilari Municipal Council", "Thakurdwara Municipal Council"],
    "townCouncils": ["Agwanpur Town Council", "Bhojpur Dharampur Town Council", "Kanth Town Council", "Kundarki Town Council", "Pakbara Town Council", "Rustamnagar Sahaspur Town Council", "Umri Kalan Town Council"]
  },
  "Muzaffarnagar": {
    "municipalCorporations": [],
    "municipalCouncils": ["Khatoli Municipal Council", "Muzaffarnagar Municipal Council"],
    "townCouncils": ["Budhana Town Council", "Charthaval Town Council", "Jansath Town Council", "Miranpur Town Council", "Purquazi Town Council", "Shahpur Town Council", "Sisauli Town Council"]
  },
  "Pilibhit": {
    "municipalCorporations": [],
    "municipalCouncils": ["Bisalpur Municipal Council", "Pilibhit Municipal Council", "Puranpur Municipal Council"],
    "townCouncils": ["Barkhera Town Council", "Bilsanda Town Council", "Gularia Bhindara Town Council", "Jahanabad Town Council", "Kalinagar Town Council", "Madhotanda Town Council", "Neoria Husainpur Town Council"]
  },
  "Pratapgarh": {
    "municipalCorporations": [],
    "municipalCouncils": ["Bela Pratapgarh Municipal Council"],
    "townCouncils": ["Antu Town Council", "Katra Medniganj Town Council", "Kohdaur Town Council", "Kunda Town Council", "Manikpur Town Council", "Patti Town Council", "Pratapgarh City Town Council"]
  },
  "Prayagraj": {
    "municipalCorporations": ["Prayagraj Municipal Corporation"],
    "municipalCouncils": [],
    "townCouncils": ["Bharatganj Town Council", "Handia Town Council", "Jhusi Town Council", "Koraon Town Council", "Lalgopalganj Nindaura Town Council", "Mau Aima Town Council", "Phulpur Town Council", "Shankargarh Town Council", "Sirsa Town Council"]
  },
  "Raebareli": {
    "municipalCorporations": [],
    "municipalCouncils": ["Raebareli Municipal Council"],
    "townCouncils": ["Bachhrawan Town Council", "Dalmau Town Council", "Lalganj Town Council", "Maharajganj Town Council", "Parsadepur Town Council", "Salon Town Council", "Shivgarh Town Council", "Unchahar Town Council"]
  },
  "Rampur": {
    "municipalCorporations": [],
    "municipalCouncils": ["Bilaspur Municipal Council", "Milak Municipal Council", "Rampur Municipal Council", "Suar Municipal Council", "Tanda Municipal Council"],
    "townCouncils": ["Kemri Town Council", "Maswasi Town Council", "Shahabad Town Council"]
  },
  "Saharanpur": {
    "municipalCorporations": ["Saharanpur Municipal Corporation"],
    "municipalCouncils": ["Deoband Municipal Council", "Gangoh Municipal Council", "Nakur Municipal Council", "Sarsawa Municipal Council"],
    "townCouncils": ["Ambehta Town Council", "Chilkana Sultanpur Town Council", "Nanauta Town Council", "Rampur Maniharan Town Council", "Titron Town Council"]
  },
  "Sambhal": {
    "municipalCorporations": [],
    "municipalCouncils": ["Bahjoi Municipal Council", "Chandausi Municipal Council", "Sambhal Municipal Council"],
    "townCouncils": ["Babrala Town Council", "Gawan Town Council", "Gunnaur Town Council", "Narauli Town Council", "Sirsi Town Council"]
  },
  "Sant Kabir Nagar": {
    "municipalCorporations": [],
    "municipalCouncils": ["Khalilabad Municipal Council"],
    "townCouncils": ["Bakhira Town Council", "Belhar Kala Town Council", "Dhanghata Town Council", "Hariharpur Town Council", "Ledwa Mahua Town Council", "Maghar Town Council", "Mehdawal Town Council"]
  },
  "Shahjahanpur": {
    "municipalCorporations": ["Shahjahanpur Municipal Corporation"],
    "municipalCouncils": ["Jalalabad Municipal Council", "Powayan Municipal Council", "Tilhar Municipal Council"],
    "townCouncils": ["Allaganj Town Council", "Banda Town Council", "Kanth Town Council", "Katra Town Council", "Khutar Town Council", "Nigohi Town Council", "Roza Town Council"]
  },
  "Shamli": {
    "municipalCorporations": [],
    "municipalCouncils": ["Kairana Municipal Council", "Kandhla Municipal Council", "Shamli Municipal Council"],
    "townCouncils": ["Ailum Town Council", "Banat Town Council", "Garhi Pukhta Town Council", "Jalilpur Town Council", "Jhinjhana Town Council", "Thana Bhawan Town Council", "Un Town Council"]
  },
  "Shravasti": {
    "municipalCorporations": [],
    "municipalCouncils": ["Bhinga Municipal Council"],
    "townCouncils": ["Ikauna Town Council"]
  },
  "Siddharthnagar": {
    "municipalCorporations": [],
    "municipalCouncils": ["Bansi Municipal Council", "Siddharthnagar (Naugarh) Municipal Council"],
    "townCouncils": ["Barhni Bazar Town Council", "Birdpur Town Council", "Domariyaganj Town Council", "Itwa Town Council", "Kapilvastu Town Council", "Shohratgarh Town Council"]
  },
  "Sitapur": {
    "municipalCorporations": [],
    "municipalCouncils": ["Biswan Municipal Council", "Laharpur Municipal Council", "Mahmudabad Municipal Council", "Misrikh-cum-Neemsar Municipal Council", "Sitapur Municipal Council"],
    "townCouncils": ["Hargaon Town Council", "Khairabad Town Council", "Maholi Town Council", "Paintepur Town Council", "Sidhauli Town Council", "Tambaur-cum-Ahmadabad Town Council"]
  },
  "Sonbhadra": {
    "municipalCorporations": [],
    "municipalCouncils": ["Robertsganj Municipal Council"],
    "townCouncils": ["Anpara Town Council", "Chopan Town Council", "Churk Ghurma Town Council", "Duddhi Town Council", "Ghorawal Town Council", "Obra Town Council", "Pipri Town Council", "Renukoot Town Council"]
  },
  "Sultanpur": {
    "municipalCorporations": [],
    "municipalCouncils": ["Sultanpur Municipal Council"],
    "townCouncils": ["Amethi Town Council", "Dostpur Town Council", "Kadipur Town Council", "Koeripur Town Council", "Kurebhar Town Council", "Lambhua Town Council"]
  },
  "Unnao": {
    "municipalCorporations": [],
    "municipalCouncils": ["Bangarmau Municipal Council", "Ganga Ghat (Shuklaganj) Municipal Council", "Unnao Municipal Council"],
    "townCouncils": ["Auras Town Council", "Bhagwant Nagar Town Council", "Bighapur Town Council", "Fatehpur Chaurasi Town Council", "Ganj Muradabad Town Council", "Hyderabad Town Council", "Karohan Town Council", "Kursath Town Council", "Maurawan Town Council", "Mohan Town Council", "Nawabganj Town Council", "Nyotini Town Council", "Purwa Town Council", "Rasoolabad Town Council", "Safipur Town Council", "Ugu Town Council"]
  },
  "Varanasi": {
    "municipalCorporations": ["Varanasi Municipal Corporation"],
    "municipalCouncils": [],
    "townCouncils": ["Gangapur Town Council", "Phulpur Town Council", "Ramnagar Town Council"]
  }
};

/**
 * Standard list of local body types
 */
const LOCAL_BODY_TYPES = [
  { id: "MUNICIPAL_CORP", key: "municipalCorporations", label: "Municipal Corporation", canonical: "Nagar Nigam" },
  { id: "MUNICIPAL_COUNCIL", key: "municipalCouncils", label: "Municipal Council", canonical: "Nagar Palika Parishad" },
  { id: "TOWN_COUNCIL", key: "townCouncils", label: "Town Council", canonical: "Nagar Panchayat" }
];

/**
 * Helpers for Citizen Portal
 */
const UpJurisdiction = {
  data: UP_JURISDICTION_DATA,
  types: LOCAL_BODY_TYPES,

  getDistricts() {
    return Object.keys(UP_JURISDICTION_DATA).sort((a, b) => a.localeCompare(b));
  },

  getDistrictData(district) {
    if (!district || !UP_JURISDICTION_DATA[district]) return null;
    return UP_JURISDICTION_DATA[district];
  },

  isTypeAvailable(district, typeKey) {
    const dData = this.getDistrictData(district);
    if (!dData) return false;
    const list = dData[typeKey];
    return Array.isArray(list) && list.length > 0;
  },

  getLocalBodies(district, typeKey) {
    const dData = this.getDistrictData(district);
    if (!dData) return [];
    return dData[typeKey] || [];
  },

  validateCombination(district, typeKey, bodyName) {
    const dData = this.getDistrictData(district);
    if (!dData) return false;
    const list = dData[typeKey];
    if (!Array.isArray(list) || list.length === 0) return false;
    return list.includes(bodyName);
  }
};

if (typeof window !== 'undefined') {
  window.UpJurisdiction = UpJurisdiction;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { UP_JURISDICTION_DATA, LOCAL_BODY_TYPES, UpJurisdiction };
}
