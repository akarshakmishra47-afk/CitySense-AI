let currentCorpData = null;
let mapInstance = null;
let hierarchyData = [];
let activeTier = 'Nagar Nigam';
let mapMarkers = [];
let mapCircles = [];

// Hardcoded coordinates for UP Municipal Corporations for Hackathon Demo
const corpCoords = {
  // 17 Nagar Nigams (Municipal Corporations)
  "Agra": [27.1767, 78.0081],
  "Aligarh": [27.8974, 78.0880],
  "Ayodhya": [26.7922, 82.1998],
  "Bareilly": [28.3670, 79.4304],
  "Firozabad": [27.1590, 78.3957],
  "Ghaziabad": [28.6692, 77.4538],
  "Gorakhpur": [26.7606, 83.3732],
  "Jhansi": [25.4484, 78.5685],
  "Kanpur": [26.4499, 80.3319],
  "Lucknow": [26.8467, 80.9462],
  "Meerut": [28.9845, 77.7064],
  "Moradabad": [28.8386, 78.7733],
  "Prayagraj": [25.4358, 81.8463],
  "Saharanpur": [29.9640, 77.5460],
  "Shahjahanpur": [27.8804, 79.9126],
  "Varanasi": [25.3176, 82.9739],
  "Mathura-Vrindavan": [27.4924, 77.6737],
  
  // Nagar Palika Parishads
  "Achhnera": [27.8048, 78.7423],
  "Afzalgarh": [28.8075, 81.2096],
  "Ahraura": [26.1663, 80.7394],
  "Akbarpur": [27.2243, 77.8442],
  "Aliganj": [28.9468, 77.7296],
  "Amroha": [28.9013, 82.4222],
  "Anupshahr": [27.2736, 83.1851],
  "Aonla": [28.7331, 83.0946],
  "Atarra": [25.2577, 80.7004],
  "Atrauli": [24.7627, 80.4168],
  "Auraiya": [29.3552, 82.5679],
  "Awagarh": [26.9991, 82.6939],
  "Azamgarh": [24.7745, 81.0759],
  "Bachhraon": [29.3778, 83.7982],
  "Baghpat": [28.1887, 81.4074],
  "Bah": [29.9890, 83.4749],
  "Baheri": [24.5081, 80.2394],
  "Bahjoi": [28.3611, 78.3715],
  "Bahraich": [24.9935, 83.5556],
  "Ballia": [24.1269, 79.8381],
  "Balrampur": [26.7411, 83.9269],
  "Banda": [24.6693, 82.8963],
  "Bangarmau": [29.4748, 80.6213],
  "Bansi": [29.2756, 83.1183],
  "Baraut": [29.2629, 80.4606],
  "Barua Sagar": [24.2336, 83.5467],
  "Basti": [28.2104, 82.6993],
  "Bela Pratapgarh": [24.0281, 83.6829],
  "Bhadohi": [29.0109, 83.9377],
  "Bharthana": [29.0205, 83.5867],
  "Bharwari": [24.6976, 80.3110],
  "Bhinga": [24.6095, 77.8754],
  "Bijnor": [29.3203, 77.5153],
  "Bilari": [26.8999, 78.6386],
  "Bilariaganj": [25.6872, 81.5501],
  "Bilaspur": [26.0363, 81.9732],
  "Bilgram": [26.0084, 83.0474],
  "Bilhaur": [26.9751, 79.8558],
  "Bilsi": [25.2406, 80.9683],
  "Bindki": [25.4550, 82.8924],
  "Bisalpur": [24.4990, 79.1240],
  "Bisauli": [24.4221, 80.9282],
  "Biswan": [26.2627, 83.7745],
  "Budaun": [27.1496, 83.3736],
  "Bulandshahr": [25.9895, 81.5982],
  "Chandausi": [26.5060, 80.6039],
  "Chandpur": [25.3301, 79.6447],
  "Charkhari": [26.0123, 80.2226],
  "Chhibramau": [24.1041, 79.4926],
  "Chirgaon": [28.5355, 79.8230],
  "Chitrakoot Dham Karwi": [29.2271, 83.7174],
  "Chunar": [29.5988, 80.8873],
  "Colonelganj": [27.3329, 82.2314],
  "Dadri": [24.8971, 80.7841],
  "Dataganj": [25.4770, 82.6710],
  "Deoband": [24.2693, 77.8238],
  "Deoria": [24.6133, 80.1057],
  "Dhampur": [27.1678, 79.7268],
  "Dhanaura": [28.4848, 80.5363],
  "Dibai": [28.0071, 79.7502],
  "Etah": [24.0610, 79.1897],
  "Etawah": [24.2884, 83.9872],
  "Etmadpur": [24.8693, 79.8391],
  "Faridpur": [28.2603, 79.6069],
  "Farrukhabad": [24.5364, 79.7900],
  "Fatehpur": [29.8095, 81.7485],
  "Fatehpur Sikri": [28.5064, 79.0328],
  "Gajraula": [25.2928, 81.9480],
  "Gangaghat": [26.9259, 77.8350],
  "Gangoh": [26.2600, 80.5558],
  "Ganj Dundawara": [28.6263, 82.1189],
  "Garhmukteshwar": [27.7960, 81.7025],
  "Gaura Barhaj": [25.1787, 82.5980],
  "Gauriganj": [25.4740, 81.9163],
  "Ghatampur": [28.2002, 82.1661],
  "Ghazipur": [29.6410, 83.2435],
  "Gola Gokarannath": [28.6208, 80.6166],
  "Gonda": [26.2641, 78.6134],
  "Gopiganj": [26.9001, 78.7624],
  "Gulaothi": [27.0477, 80.6525],
  "Gursahaiganj": [26.2111, 81.6409],
  "Gursarai": [29.3256, 83.7040],
  "Haldaur": [25.3759, 81.0870],
  "Hamirpur": [27.0052, 81.2781],
  "Hapur": [27.5379, 81.4044],
  "Hardoi": [25.7536, 82.5073],
  "Hasanpur": [27.0340, 82.9795],
  "Hata": [24.1460, 81.3025],
  "Hathras": [25.7918, 78.0984],
  "Jahangirabad": [28.8124, 81.3229],
  "Jais": [28.6747, 78.8816],
  "Jalalabad": [27.2019, 81.1345],
  "Jalalpur": [25.5915, 81.8045],
  "Jalaun": [28.6068, 78.5506],
  "Jalesar": [29.3266, 83.5655],
  "Jaswantnagar": [25.1913, 78.7349],
  "Jaunpur": [26.2573, 80.1600],
  "Jhinjhak": [25.8498, 81.9861],
  "Kaimganj": [29.0063, 78.3261],
  "Kairana": [27.9077, 83.2216],
  "Kakrala": [25.4637, 77.7286],
  "Kalpi": [28.6180, 83.7446],
  "Kandhla": [28.9544, 78.6549],
  "Kannauj": [27.4525, 82.1936],
  "Kasganj": [29.8494, 82.3656],
  "Khair": [25.3116, 78.7477],
  "Khairabad": [26.4842, 83.3966],
  "Khalilabad": [29.1024, 80.1957],
  "Khatauli": [27.2304, 83.8719],
  "Khekada": [25.7095, 77.5961],
  "Khoda": [29.2099, 78.6336],
  "Khurja": [26.2476, 81.9120],
  "Kiratpur": [26.0951, 77.9434],
  "Konch": [25.8054, 77.5470],
  "Kosi Kalan": [25.2897, 80.8433],
  "Kushinagar": [24.4579, 80.6620],
  "Laharpur": [27.3469, 77.5823],
  "Lakhimpur": [25.3342, 82.7683],
  "Lalitpur": [24.4431, 80.3127],
  "Loni": [26.5834, 81.0473],
  "Maharajganj": [27.0979, 78.7983],
  "Mahmoodabad": [26.1442, 79.0800],
  "Mahoba": [25.8915, 82.1018],
  "Mainpuri": [26.6816, 83.2826],
  "Mallawan": [27.8020, 79.1850],
  "Manjhanpur": [28.1418, 79.3252],
  "Marhara": [24.4343, 82.7341],
  "Mau": [29.4920, 78.4984],
  "Maudaha": [25.7974, 79.2616],
  "Mauranipur": [28.4348, 81.9214],
  "Mawana": [26.2110, 78.8728],
  "Milak": [25.1977, 80.8660],
  "Mirzapur": [24.5316, 79.0917],
  "Misrikh Neemsar": [29.5578, 79.5285],
  "Modinagar": [29.1869, 81.3336],
  "Mohammadabad": [24.6914, 81.7401],
  "Mohammadi": [27.2537, 78.0155],
  "Mubarakpur": [25.8501, 81.4256],
  "Mungra Badshahpur": [25.5159, 77.7641],
  "Muradnagar": [27.0968, 81.6200],
  "Muzaffarnagar": [28.4472, 81.6187],
  "Nagina": [28.1384, 78.6022],
  "Najibabad": [26.7864, 81.0042],
  "Nakur": [29.5380, 82.0069],
  "Nanpara": [26.7103, 82.4526],
  "Nautanwa": [28.5859, 78.3696],
  "Nawabganj": [26.7709, 80.3060],
  "Nehtaur": [28.6636, 79.0544],
  "Noorpur": [27.3961, 77.9010],
  "Orai": [26.5167, 77.9470],
  "Padrauna": [24.3266, 82.9127],
  "Paliya Kalan": [25.4995, 79.5636],
  "Pihani": [28.1329, 83.0019],
  "Pilibhit": [24.0419, 83.0669],
  "Pilkhuwa": [27.4055, 77.8081],
  "Powayan": [26.6383, 79.6673],
  "Pt. Deen Dayal Upadhyaya Nagar": [26.4165, 81.8819],
  "Pukhrayan": [27.9779, 80.5439],
  "Puranpur": [25.7725, 81.1348],
  "Raebareli": [26.7932, 82.6469],
  "Rampur": [29.5247, 82.1592],
  "Rasara": [24.0742, 81.7243],
  "Rath": [26.5017, 79.6499],
  "Robertsganj": [24.5816, 80.3292],
  "Rudauli": [26.2949, 82.6727],
  "Sahaswan": [26.9021, 80.6358],
  "Sambhal": [26.9886, 83.2284],
  "Samthar": [25.0218, 80.5870],
  "Sandi": [28.9136, 80.9249],
  "Sandila": [24.7052, 81.6131],
  "Sardhana": [24.7475, 78.2380],
  "Sarsawa": [24.7403, 79.0314],
  "Seohara": [27.5294, 82.6636],
  "Shahabad": [25.2641, 81.0022],
  "Shahganj": [25.3667, 79.8526],
  "Shamli": [27.0316, 80.6681],
  "Shamsabad": [29.7152, 81.8140],
  "Sherkot": [24.8493, 82.6266],
  "Shikarpur": [25.2727, 79.3396],
  "Shikohabad": [28.7359, 78.4782],
  "Siddharthanagar": [29.1132, 81.0161],
  "Sikandra Rao": [28.0049, 81.7973],
  "Sikandrabad": [27.1289, 78.2228],
  "Sirsaganj": [27.8360, 80.3756],
  "Siswa Bazar": [27.0042, 82.2150],
  "Sitapur": [25.7792, 80.8734],
  "Soron": [28.9987, 83.6624],
  "Suar": [28.2393, 83.3405],
  "Sultanpur": [27.1358, 78.9305],
  "Syana": [27.5908, 79.6225],
  "Tanda": [27.9621, 81.8269],
  "Thakurdwara": [24.0103, 80.3552],
  "Tilhar": [24.1269, 78.1131],
  "Tundla": [27.6627, 82.0987],
  "Ujhani": [28.7304, 83.2737],
  "Unnao": [29.0315, 83.7483],
  "Utraula": [24.4680, 79.3996],
  "Zamania": [26.4495, 83.4226],

  
  // Nagar Panchayats
  "Dayalbagh": [29.8344, 81.5694],
  "Fatehabad": [26.3092, 79.135],
  "Jagner": [24.8808, 84.0729],
  "Kheragarh": [29.4198, 83.171],
  "Kuraoli": [25.8557, 84.4103],
  "Pinahat": [24.3107, 80.6927],
  "Swamibagh": [24.5394, 83.9095],
  "Barauli": [26.1368, 79.9034],
  "Beswan": [27.5177, 82.6453],
  "Chandaus": [28.7288, 79.6143],
  "Chharra": [29.1544, 79.377],
  "Gabhana": [26.4777, 84.5995],
  "Harduaganj": [25.4733, 84.0314],
  "Iglas": [27.717, 81.1962],
  "Jalali": [26.8834, 78.7551],
  "Jattari": [30.0123, 78.6369],
  "Jawan Sikandarpur": [25.9652, 77.2519],
  "Kauriaganj": [28.0395, 83.3836],
  "Madrak": [29.6684, 81.5609],
  "Pilkhana": [23.8899, 81.9789],
  "Pisawa": [29.4052, 79.4424],
  "Tappal": [24.2696, 81.8421],
  "Vijaigarh": [24.0457, 84.3949],
  "Ashrafpur Kichhauchha": [25.0596, 78.4803],
  "Iltifatganj": [24.0854, 80.7584],
  "Jahangirganj": [29.3382, 81.4109],
  "Rajesultanpur": [23.9992, 82.8536],
  "Musafirkhana": [28.0345, 77.6093],
  "Joya": [26.5208, 81.9036],
  "Naugawan Sadat": [25.5606, 83.5825],
  "Saidangali": [25.088, 84.1556],
  "Ujhari": [24.2266, 78.9137],
  "Achhalda": [27.2126, 81.4631],
  "Atasu": [26.1366, 83.6675],
  "Babarpur Ajitmal": [28.3145, 77.9626],
  "Bidhuna": [26.1923, 81.0347],
  "Dibiyapur": [25.89, 80.7725],
  "Phaphund": [27.0238, 82.6825],
  "Bhadarsa": [26.5919, 82.5616],
  "Bikapur": [29.04, 81.3467],
  "Goshainganj": [27.5124, 82.6113],
  "Khirauni Suchittaganj": [24.2692, 84.3047],
  "Kumarganj": [28.1191, 84.32],
  "Maa Kamakhya": [24.4448, 77.3904],
  "Atraulia": [30.0713, 81.1202],
  "Azmatgarh": [25.8167, 77.0801],
  "Budhanpur": [28.3944, 77.3077],
  "Jahanaganj Bazar": [28.3287, 82.558],
  "Jiyanpur": [25.8183, 84.0016],
  "Katghar Lalganj": [27.8534, 83.9933],
  "Mahul": [26.7344, 80.6767],
  "Martinganj": [26.0825, 78.9045],
  "Mehnagar": [28.2854, 83.223],
  "Nizamabad": [25.4287, 80.0095],
  "Phulpur": [25.9544, 80.5294],
  "Sarai Mir": [29.0685, 77.6349],
  "Aminagar Sarai": [26.7691, 83.4577],
  "Chhaprauli": [28.0855, 81.0234],
  "Doghat": [29.1367, 78.1799],
  "Rataul": [28.6236, 79.6251],
  "Tatiri": [27.3153, 77.1334],
  "Tikri": [25.3882, 83.5565],
  "Jarwal": [29.693, 82.8647],
  "Kaiserganj": [28.5874, 79.4263],
  "Mihipurwa": [26.4403, 77.6977],
  "Payagpur": [26.9869, 79.0264],
  "Risia": [25.2081, 81.4735],
  "Rupaidiha": [24.8269, 77.0525],
  "Bairia": [25.3952, 81.9937],
  "Bansdih": [27.8444, 78.4443],
  "Belthara Road": [29.1291, 83.9964],
  "Chitbara Gaon": [24.59, 81.0286],
  "Maniyar": [27.3342, 77.0223],
  "Nagra": [24.3759, 79.4878],
  "Ratsar Kalan": [29.9646, 78.098],
  "Reoti": [29.9711, 77.9383],
  "Sahatwar": [28.3927, 82.666],
  "Sikanderpur": [30.1305, 77.8506],
  "Gainsari": [28.466, 78.4302],
  "Pachperwa": [26.0401, 83.4584],
  "Tulsipur": [24.9586, 77.5863],
  "Baberu": [25.1444, 81.1999],
  "Bisanda": [26.2357, 83.4021],
  "Mataundh": [28.9575, 79.7359],
  "Naraini": [27.0098, 79.6661],
  "Oran": [25.1925, 78.4201],
  "Tindwari": [29.823, 78.5128],
  "Banki": [25.8135, 78.6696],
  "Belahra": [29.6457, 80.2535],
  "Dariyabad": [26.8343, 83.922],
  "Dewa": [24.3335, 78.7122],
  "Haidergarh": [28.6982, 83.1764],
  "Ramnagar": [29.4605, 80.2297],
  "Ram Sanehi Ghat": [25.7275, 80.0622],
  "Satrikh": [26.9434, 81.1437],
  "Siddhaur": [23.9559, 81.5724],
  "Subeha": [24.1393, 81.5445],
  "Tikait Nagar": [28.7518, 83.6205],
  "Zaidpur": [26.6939, 82.0882],
  "Bisharatganj": [29.5707, 83.1654],
  "Deoranian": [24.7106, 84.3969],
  "Dhaura Tanda": [26.2051, 77.2153],
  "Fatehganj Pashchimi": [23.8815, 82.201],
  "Fatehganj Purvi": [28.1081, 80.1493],
  "Mirganj": [27.4454, 84.2957],
  "Rathaura": [25.8313, 78.1099],
  "Richha": [23.8037, 80.9484],
  "Sainthal": [27.3212, 84.1214],
  "Shahi": [24.5518, 78.1348],
  "Shergarh": [27.2779, 78.3751],
  "Shishgarh": [25.1164, 79.2118],
  "Sirauli": [28.253, 82.0337],
  "Thiriya Nizamat Khan": [27.7156, 81.0968],
  "Babhnan Bazar": [24.307, 84.3388],
  "Bankati": [24.3483, 77.3882],
  "Bhanpur": [29.8499, 80.3033],
  "Ganeshpur": [28.6035, 83.5177],
  "Gayghat": [25.1773, 83.2776],
  "Harraiya": [27.6216, 78.0935],
  "Kaptanganj": [25.9304, 81.9983],
  "Munderwa": [24.8581, 84.3802],
  "Nagar Bazar": [24.6582, 77.2552],
  "Rudhauli Bazar": [24.8997, 82.6637],
  "Ghosia": [29.1948, 78.7055],
  "Gyanpur": [24.1751, 77.3944],
  "Khamaria": [29.6075, 84.3261],
  "Nai Bazar": [25.3916, 83.0727],
  "Suriyawan": [28.5359, 80.0975],
  "Barhapur": [29.5796, 80.3296],
  "Jhalu": [25.6184, 82.613],
  "Mandawar": [28.0013, 79.5622],
  "Sahanpur": [29.2699, 78.0307],
  "Sahaspur": [28.946, 80.9969],
  "Alapur": [30.1983, 83.5186],
  "Dahgawan": [27.3937, 78.9055],
  "Faizganj": [30.1629, 78.1563],
  "Gulariya": [26.0214, 83.8975],
  "Islamnagar": [27.4832, 83.1534],
  "Kachhla": [30.1705, 80.9755],
  "Kunwargaon": [26.1403, 80.099],
  "Mudiya": [25.8117, 82.0505],
  "Rudayan": [25.2847, 79.6217],
  "Saidpur": [25.5162, 79.6785],
  "Sakhanu": [27.1691, 77.6643],
  "Usawan": [25.4947, 79.4916],
  "Usehat": [28.7157, 80.9863],
  "Wazirganj": [27.4902, 81.0299],
  "Aurangabad": [24.2781, 78.0524],
  "Bhawan Bahadur Nagar": [25.7469, 80.4619],
  "Bugrasi": [28.0763, 78.438],
  "Chhatari": [26.943, 78.908],
  "Kakod": [26.651, 80.3787],
  "Khanpur": [28.8969, 84.004],
  "Narora": [28.4389, 79.9559],
  "Pahasu": [29.2876, 81.6567],
  "Chakia": [25.8734, 78.9476],
  "Saiyad Raja": [25.9816, 78.6821],
  "Manikpur": [26.0498, 80.6365],
  "Rajapur": [27.8356, 81.2635],
  "Baitalpur": [26.1104, 79.2378],
  "Bariyarpur": [27.5929, 82.2957],
  "Bhaluani": [27.4496, 77.8087],
  "Bhatni": [24.743, 79.3599],
  "Bhatpar Rani": [26.4098, 81.0172],
  "Gauri Bazar": [24.5812, 81.9644],
  "Hetimpur": [28.6879, 84.0843],
  "Lar": [24.5899, 83.5413],
  "Madanpur": [28.3639, 81.2096],
  "Majhauli Raj": [24.051, 78.9551],
  "Pathardeva": [25.1046, 79.8489],
  "Rampur Karkhana": [29.5691, 81.4233],
  "Rudrapur": [25.991, 82.8271],
  "Salempur": [29.5133, 81.3976],
  "Tarkulwa": [27.2984, 80.4059],
  "Jaithara": [24.09, 78.6001],
  "Mirehachi": [27.5804, 83.4059],
  "Nidhauli Kalan": [26.9333, 80.8485],
  "Raja Ka Rampur": [24.4301, 78.2349],
  "Sakit": [29.4068, 81.7563],
  "Bakewar": [28.0051, 80.687],
  "Ekdil": [29.345, 81.6271],
  "Lakhna": [25.9307, 81.6509],
  "Kamalganj": [29.6784, 78.169],
  "Kampil": [25.1416, 84.5287],
  "Khimsepur": [26.4682, 82.007],
  "Sankisa Basantpur": [29.3228, 80.5471],
  "Asothar": [23.8711, 78.6687],
  "Bahuwa": [24.9217, 79.9008],
  "Hathgaon": [26.8043, 78.0274],
  "Karikan Dhata": [29.2603, 83.6883],
  "Khaga": [25.9351, 80.9357],
  "Khakhreru": [29.6414, 84.3747],
  "Kishunpur": [24.1749, 78.2855],
  "Kora Jahanabad": [26.8935, 79.4675],
  "Eka": [25.4786, 77.4008],
  "Fariha": [24.8117, 80.3742],
  "Jasrana": [26.1259, 80.5935],
  "Makkhanpur": [24.1048, 81.4644],
  "Dankaur": [26.9537, 83.7865],
  "Jahangirpur": [29.5916, 77.1911],
  "Jewar": [29.6942, 84.2285],
  "Rabupura": [25.0954, 82.4872],
  "Khoda-Makanpur": [24.8933, 81.2254],
  "Dasna": [24.1458, 82.5497],
  "Faridnagar": [29.3093, 78.3252],
  "Niwari": [28.8526, 78.7837],
  "Patala": [27.4451, 77.4889],
  "Bahadurganj": [27.1741, 80.3631],
  "Dildarnagar": [28.6661, 78.943],
  "Jangipur": [26.4198, 84.0753],
  "Sadat": [25.8698, 83.6177],
  "Saidpur": [25.157, 80.753],
  "Belsar": [28.0191, 77.1995],
  "Dhanepur": [23.9204, 84.1601],
  "Katra": [28.8117, 77.464],
  "Khargupur": [27.1466, 81.9175],
  "Mankapur": [24.6769, 77.7731],
  "Paraspur": [25.3269, 83.7032],
  "Tarabganj": [28.7138, 78.1564],
  "Bansgaon": [28.933, 83.6926],
  "Barhalganj": [24.4562, 78.9168],
  "Campierganj": [30.098, 81.9399],
  "Ghaghsara Bazar": [25.9891, 83.475],
  "Gola Bazar": [25.5519, 79.5174],
  "Kasba Sangrampur Unwal": [29.5608, 84.0321],
  "Mundera Bazar": [26.0312, 83.536],
  "Pipiganj": [29.3221, 78.0969],
  "Pipraich": [29.3254, 81.429],
  "Sahjanwan": [29.3678, 81.7724],
  "Uruwa Bazar": [28.2943, 77.9596],
  "Gohand": [29.8904, 77.401],
  "Kurara": [27.6329, 84.5629],
  "Sarila": [28.6476, 83.1977],
  "Sumerpur": [27.9088, 82.9969],
  "Babugarh": [29.1133, 82.7749],
  "Beniganj": [27.0479, 83.0552],
  "Gopamau": [29.1695, 80.29],
  "Kachhauna Patseni": [27.0201, 84.4938],
  "Kursath": [25.0333, 78.3651],
  "Madhoganj": [27.8265, 78.7818],
  "Pali": [25.3631, 84.2676],
  "Hasayan": [26.142, 84.3514],
  "Mendu": [30.1494, 80.9834],
  "Mursan": [25.5873, 79.6071],
  "Purdilnagar": [28.2771, 78.3693],
  "Sadabad": [29.88, 77.4721],
  "Sahpau": [27.4191, 81.1441],
  "Sasni": [24.0957, 82.048],
  "Ait": [25.0992, 79.8539],
  "Kadaura": [26.5135, 80.7518],
  "Kotra": [26.1945, 77.0647],
  "Madhogarh": [26.0487, 79.4188],
  "Nadigaon": [29.1736, 78.2212],
  "Rampura": [28.6604, 81.6506],
  "Umri": [24.4514, 77.2149],
  "Badlapur": [25.6362, 83.9769],
  "Gaurabadshahpur": [23.961, 79.4254],
  "Jafarabad": [28.4226, 79.0943],
  "Kajgaon": [30.122, 82.8046],
  "Kerakat": [26.061, 82.7401],
  "Kheta Sarai": [28.2325, 81.1114],
  "Machhlishahr": [28.7169, 77.5395],
  "Mariahu": [29.2285, 78.8088],
  "Bada Gaon": [25.2741, 79.9989],
  "Erich": [28.0791, 77.7726],
  "Garautha": [24.0558, 84.3698],
  "Kathera": [30.1896, 78.3822],
  "Moth": [30.0613, 83.9871],
  "Ranipur": [26.0201, 81.3302],
  "Tondi Fatehpur": [29.2566, 84.3732],
  "Samdhan": [26.2478, 79.5704],
  "Saurikh": [28.2123, 81.4056],
  "Sikanderpur": [26.6094, 78.4718],
  "Talgram": [28.6346, 77.0533],
  "Tirwaganj": [27.1574, 80.2341],
  "Amraudha": [28.871, 82.5382],
  "Derapur": [29.9655, 78.1801],
  "Kanchausi": [25.5905, 81.0491],
  "Musanagar": [26.0898, 79.603],
  "Rajpur": [25.9307, 81.3131],
  "Rania": [27.0368, 79.2134],
  "Rasulabad": [25.6792, 83.8591],
  "Rura": [29.9082, 77.7757],
  "Shivli": [24.8718, 83.3661],
  "Sikandara": [26.9234, 77.3368],
  "Bithoor": [27.6272, 78.5282],
  "Shivrajpur": [25.9762, 80.4692],
  "Amanpur": [24.72, 78.3414],
  "Bhargain": [25.6458, 77.2188],
  "Bilram": [30.0838, 83.2227],
  "Mohanpur": [27.4986, 81.5561],
  "Patiyali": [24.1644, 82.7383],
  "Sahawar": [25.501, 77.7493],
  "Sidhpura": [29.8835, 83.7994],
  "Ajhuwa": [25.1541, 78.5376],
  "Chail": [29.2176, 81.9377],
  "Charwa": [27.4871, 83.2205],
  "Karari": [27.8318, 80.3222],
  "Purab-Pashchim Sharira": [30.1692, 78.573],
  "Sarai Aquil": [27.0115, 77.0708],
  "Sirathu": [27.9148, 83.7223],
  "Chhitauni": [28.3841, 83.5011],
  "Dudahi": [26.8729, 83.3257],
  "Kaptanganj": [29.8608, 79.486],
  "Khadda": [25.5806, 79.3488],
  "Fazilnagar": [24.6846, 78.2008],
  "Mathauli": [29.4906, 80.7062],
  "Ramkola": [25.8963, 82.3095],
  "Sewarhi": [24.7416, 80.0262],
  "Sukrauli": [29.3795, 80.4611],
  "Tamkuhi Raj": [29.4205, 81.9544],
  "Palia Kalan": [26.1648, 77.4012],
  "Bardar": [26.4417, 80.7215],
  "Bhira": [27.8738, 81.216],
  "Dhaurahra": [27.6824, 81.1778],
  "Kheri": [29.0311, 78.9115],
  "Mailani": [24.0186, 82.7821],
  "Nighasan": [28.7591, 78.6433],
  "Oel Dhakwa": [28.8722, 77.0716],
  "Singahi Bhiraura": [27.3255, 80.3666],
  "Mahroni": [29.2156, 79.5129],
  "Pali": [29.3545, 78.2331],
  "Talbehat": [26.062, 79.4128],
  "Bakshi Ka Talab": [24.8613, 79.1356],
  "Banthra": [26.0711, 81.5871],
  "Gosainganj": [24.1944, 80.8417],
  "Itaunja": [27.8367, 81.0159],
  "Kakori": [27.8059, 81.0628],
  "Mahona": [23.9635, 78.4128],
  "Malihabad": [24.2802, 82.7251],
  "Mohanlalganj": [29.0611, 78.0601],
  "Nagram": [28.2763, 83.0128],
  "Anandnagar": [26.8145, 78.8028],
  "Brijmanganj": [25.8375, 83.0518],
  "Chowk": [27.0337, 84.2151],
  "Ghughali": [27.6465, 83.0059],
  "Nichlaul": [28.0889, 81.5543],
  "Paniyara": [27.2539, 77.9522],
  "Partawal": [27.0692, 82.8753],
  "Sonauli": [29.7241, 79.9643],
  "Kabrai": [28.6741, 81.0297],
  "Kharela": [30.0419, 82.5034],
  "Kulpahar": [28.6994, 81.2016],
  "Barnahal": [29.1065, 77.6781],
  "Bewar": [29.183, 83.3426],
  "Bhogaon": [25.277, 81.6546],
  "Ghiraur": [28.2363, 77.4296],
  "Jyoti Khuria": [30.0418, 79.3569],
  "Karhal": [23.985, 78.4199],
  "Kishni": [28.4474, 84.203],
  "Kuraoli": [29.746, 80.7782],
  "Kusmara": [24.9643, 82.4588],
  "Bajna": [29.8809, 77.1815],
  "Baldev": [27.7566, 80.8719],
  "Barsana": [25.9249, 84.4566],
  "Chaumuhan": [24.1211, 83.2432],
  "Chhata": [24.0611, 78.0923],
  "Farah": [25.0235, 78.196],
  "Gokul": [28.0248, 80.5152],
  "Goverdhan": [27.6391, 77.4419],
  "Mahaban": [23.9302, 83.0479],
  "Nandgaon": [24.9209, 82.8938],
  "Radha Kund": [28.5093, 81.7819],
  "Raya": [27.6715, 79.042],
  "Saunkh": [26.965, 78.1735],
  "Adari": [29.2949, 78.9199],
  "Amila": [26.1139, 77.8413],
  "Chiraiyakot": [25.8096, 80.3432],
  "Dohrighat": [26.6728, 78.5688],
  "Ghosi": [25.9823, 78.9775],
  "Kopaganj": [24.104, 80.3257],
  "Kurthi Jafarpur": [26.3364, 77.435],
  "Madhuban": [27.7678, 83.8966],
  "Mohammadabad Gohna": [29.0057, 82.3534],
  "Walidpur": [26.2559, 82.824],
  "Bahsuma": [28.0818, 77.5919],
  "Daurala": [26.8448, 82.6464],
  "Harra": [27.3567, 77.7788],
  "Hastinapur": [27.9717, 80.2769],
  "Karnawal": [25.1417, 77.2424],
  "Kharkhauda": [26.0225, 81.8268],
  "Khiwai": [24.4075, 81.1053],
  "Lawar": [27.4973, 78.2962],
  "Parikshitgarh": [27.6229, 81.829],
  "Sewalkhas": [27.8166, 84.0224],
  "Kachhwa": [26.9288, 78.4494],
  "Agwanpur": [29.1266, 77.8245],
  "Bhojpur Dharampur": [24.1993, 81.9732],
  "Dhakia": [27.1763, 79.8926],
  "Kanth": [28.1063, 81.2051],
  "Kundarki": [25.1991, 81.7659],
  "Mehmoodpur Maafi": [24.2751, 80.5298],
  "Pakbara": [25.9325, 81.5849],
  "Umri Kalan": [26.0371, 79.2197],
  "Bhokarhedi": [27.5478, 77.7294],
  "Budhana": [24.271, 77.7632],
  "Charthaval": [24.5306, 80.5116],
  "Jansath": [30.1179, 78.552],
  "Miranpur": [24.1032, 84.1609],
  "Purkazi": [29.2999, 79.8933],
  "Shahpur": [30.1894, 81.1107],
  "Sisauli": [26.235, 81.8148],
  "Barkhera": [26.345, 83.9506],
  "Bilsanda": [27.8208, 82.7404],
  "Gularia Bhindara": [29.1781, 77.8284],
  "Jahanabad": [28.0681, 79.9229],
  "Kalinagar": [24.2709, 77.6482],
  "Nyoria Husainpur": [29.6277, 79.9361],
  "Pakariya Naugawan": [27.623, 77.4809],
  "Antu": [29.5384, 82.3259],
  "Dhakwa": [23.9441, 80.8407],
  "Garwara Bazar": [28.9858, 83.8894],
  "Hiraganj Bazar": [26.1347, 79.8044],
  "Katra Gulab Singh": [25.1815, 77.5115],
  "Katra Medniganj": [26.503, 84.0691],
  "Kohdaur": [29.9163, 82.655],
  "Kunda": [24.4074, 84.3063],
  "Lalganj Ajhara": [24.3124, 77.7471],
  "Manikpur": [24.8838, 78.1427],
  "Patti": [29.7598, 83.7204],
  "Pratapgarh City": [26.6214, 82.146],
  "Prithviganj": [26.4035, 81.6987],
  "Ramganj": [27.7954, 80.9777],
  "Raniganj": [26.4528, 81.7365],
  "Suwansa Bazar": [27.7495, 77.1879],
  "Bharatganj": [24.1134, 82.9913],
  "Handia": [25.3265, 80.0491],
  "Jhusi": [28.8406, 80.6176],
  "Koraon": [29.4184, 83.4147],
  "Lal Gopalganj": [23.9635, 84.0487],
  "Mau Aima": [27.5771, 84.1326],
  "Phulpur": [28.1035, 83.0696],
  "Shankargarh": [25.0672, 80.4209],
  "Sirsa": [29.7994, 78.3721],
  "Bachhrawan": [25.1896, 77.7971],
  "Dalmau": [25.4819, 83.4423],
  "Lalganj": [25.9734, 79.9343],
  "Nasirabad": [30.0077, 83.3247],
  "Parsadepur": [24.503, 83.2],
  "Salon": [27.2883, 81.5874],
  "Shivgarh": [24.9997, 81.7695],
  "Unchahar": [24.5994, 78.3762],
  "Dadhiyal": [29.3983, 84.4371],
  "Kemri": [26.1884, 83.9401],
  "Maswasi": [28.8637, 80.5387],
  "Narpatnagar Dundawala": [24.3955, 79.2514],
  "Saifni": [29.1535, 77.2982],
  "Ambehta": [24.172, 84.4715],
  "Behat": [28.76, 82.1316],
  "Chhutmalpur": [28.535, 83.5676],
  "Chilkana Sultanpur": [24.0107, 83.1479],
  "Nanauta": [29.2826, 78.4163],
  "Rampur Maniharan": [23.8007, 83.9148],
  "Titron": [28.2444, 84.5221],
  "Babrala": [29.2877, 83.7152],
  "Gawan": [23.8893, 83.4721],
  "Gunnaur": [24.6169, 83.2339],
  "Narauli": [25.1212, 79.0477],
  "Sirsi": [26.0716, 80.1135],
  "Baghnagar": [27.8584, 78.0957],
  "Belhar Kalan": [26.1157, 78.2205],
  "Hainsar Bazar Dhanghata": [24.4649, 79.5298],
  "Dharmsinghwa": [29.1367, 77.4589],
  "Hariharpur": [30.1278, 83.2563],
  "Maghar": [29.4428, 82.9035],
  "Menhdawal": [28.5732, 80.9707],
  "Allahganj": [27.8386, 78.9588],
  "Kalan": [24.6766, 78.678],
  "Kant": [26.53, 77.5916],
  "Katra": [28.5697, 83.7337],
  "Khudaganj": [25.5782, 80.8971],
  "Khutar": [28.8745, 77.8429],
  "Nigohi": [29.1061, 79.5661],
  "Roza": [24.2689, 84.0443],
  "Ailam": [25.6673, 81.3794],
  "Banat": [28.9421, 83.8028],
  "Garhi Pukhta": [28.4776, 80.6605],
  "Jhinjhana": [29.0398, 78.9362],
  "Thana Bhawan": [26.4364, 77.2041],
  "Un": [27.9725, 82.7246],
  "Ikauna": [28.2371, 82.2584],
  "Barhani Bazar": [26.6606, 78.4157],
  "Barhni Chafa": [29.2792, 77.3635],
  "Bharat Bhari": [29.1115, 83.0122],
  "Biskohar": [27.3731, 80.7114],
  "Domariaganj": [24.8783, 81.54],
  "Itwa": [25.6176, 80.8304],
  "Kapilvastu": [28.161, 80.8996],
  "Shohratgarh": [29.4237, 82.6724],
  "Uska Bazar": [27.8655, 80.337],
  "Hargaon": [24.4464, 83.9076],
  "Maholi": [28.3932, 81.1351],
  "Patepur": [24.0628, 80.3604],
  "Sidhauli": [30.1827, 81.0861],
  "Tambaur Ahmadabad": [29.8079, 79.4121],
  "Anpara": [25.5338, 78.5137],
  "Chopan": [27.325, 77.1733],
  "Churk Ghurma": [24.6307, 80.6859],
  "Dala Bazar": [28.7976, 84.3131],
  "Duddhi": [27.7009, 80.5679],
  "Ghorawal": [23.8115, 77.6288],
  "Obra": [24.6655, 77.8259],
  "Pipri": [23.9525, 79.3636],
  "Renukoot": [29.3672, 82.8106],
  "Dostpur": [29.3173, 81.4734],
  "Kadipur": [28.6962, 82.1325],
  "Koeripur": [25.8735, 81.2251],
  "Lambhua": [27.3458, 80.3747],
  "Achalganj": [26.7624, 82.5126],
  "Auras": [26.4061, 79.0781],
  "Bhagwant Nagar": [28.2693, 80.466],
  "Bighapur": [26.8837, 81.4849],
  "Fatehpur Chaurasi": [25.3308, 83.1768],
  "Ganj Muradabad": [26.9091, 78.4402],
  "Hyderabad": [28.9967, 80.7318],
  "Kursath": [28.3716, 79.1093],
  "Maurawan": [29.4478, 80.0042],
  "Mohan": [25.3366, 81.9765],
  "Nyotini": [29.9038, 79.6237],
  "Purwa": [26.9782, 82.6199],
  "Rasulabad": [29.2898, 83.0979],
  "Safipur": [24.402, 84.4962],
  "Ugu": [25.9829, 83.3535],
  "Gangapur": [29.1571, 80.6342],
};

document.addEventListener('DOMContentLoaded', async () => {
  // Setup Tabs
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');
      
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      tabContents.forEach(c => c.classList.remove('active'));
      document.getElementById('tab-' + tabId).classList.add('active');
      
      if (tabId === 'map') {
        if (!mapInstance) initMap();
        else {
          mapInstance.invalidateSize();
          renderMapData(document.getElementById('map-tier-select').value);
        }
      }
    });
  });

  // Setup Tier Selector in Overview
  document.querySelectorAll('.tier-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.tier-btn').forEach(b => b.classList.remove('active-tier'));
      e.currentTarget.classList.add('active-tier');
      
      activeTier = e.currentTarget.getAttribute('data-tier');
      renderCorpList();
      
      // Clear detail panel
      document.getElementById('detail-empty').style.display = 'block';
      document.getElementById('detail-content').style.display = 'none';
    });
  });
  
  // Setup Map Filter
  const mapSelect = document.getElementById('map-tier-select');
  if (mapSelect) {
    mapSelect.addEventListener('change', (e) => {
      renderMapData(e.target.value);
    });
  }

  // Load Data
  await loadHierarchyData();
});

async function loadHierarchyData() {
  try {
    const res = await fetch('/api/analytics/hierarchy');
    hierarchyData = await res.json();
    
    // Calculate counts for the tier buttons
    let counts = { 'Nagar Nigam': 0, 'Nagar Palika Parishad': 0, 'Nagar Panchayat': 0 };
    hierarchyData.forEach(d => {
      if (d._id && d._id.type) counts[d._id.type]++;
    });
    
    document.getElementById('count-nigam').textContent = counts['Nagar Nigam'];
    document.getElementById('count-palika').textContent = counts['Nagar Palika Parishad'];
    document.getElementById('count-panchayat').textContent = counts['Nagar Panchayat'];
    
    renderCorpList();
  } catch (err) {
    console.error("Failed to load hierarchy data", err);
  }
}

function renderCorpList() {
  const listEl = document.getElementById('corp-list');
  listEl.innerHTML = ''; // clear
  
  // Filter by activeTier
  const filteredData = hierarchyData.filter(d => d._id && d._id.type === activeTier);
  
  if (filteredData.length === 0) {
    listEl.innerHTML = `<p class="text-slate-500 text-sm italic">No data available for ${activeTier}.</p>`;
    return;
  }
  
  filteredData.forEach(corp => {
    const name = corp._id.corp;
    const card = document.createElement('div');
    card.className = 'corp-card';
    card.innerHTML = `
      <div class="flex justify-between items-center mb-2">
        <h3 class="text-xl font-bold text-white">${name}</h3>
        ${corp.criticalClusters > 0 ? `<span class="badge badge-critical">${corp.criticalClusters} Critical</span>` : ''}
      </div>
      <div class="flex justify-between text-sm text-slate-400">
        <span>Total: ${corp.totalComplaints}</span>
        <span>Pending: ${corp.pendingClusters}</span>
      </div>
    `;
    
    card.addEventListener('click', () => {
      // Manage active state
      document.querySelectorAll('.corp-card').forEach(c => c.classList.remove('active-corp'));
      card.classList.add('active-corp');
      
      openCorpDetails(corp);
    });
    
    listEl.appendChild(card);
  });
}

async function openCorpDetails(corp) {
  currentCorpData = corp;
  const name = corp._id.corp;
  
  document.getElementById('detail-empty').style.display = 'none';
  document.getElementById('detail-content').style.display = 'block';
  
  // Set KPIs
  document.getElementById('detail-tier').textContent = activeTier;
  document.getElementById('detail-title').textContent = name;
  document.getElementById('kpi-total').textContent = corp.totalComplaints;
  document.getElementById('kpi-resolved').textContent = corp.resolvedClusters || 0;
  document.getElementById('kpi-pending').textContent = corp.pendingClusters || 0;
  
  // Reset AI Box
  document.getElementById('ai-review-box').style.display = 'none';
  document.getElementById('generate-ai-btn').disabled = false;
  document.getElementById('generate-ai-btn').innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
    How can we make this better?
  `;

  // Fetch specific clusters for this corp
  const feedEl = document.getElementById('problem-feed');
  feedEl.innerHTML = '<p class="text-slate-400">Loading active problem clusters...</p>';
  
  try {
    const res = await fetch(`/api/clusters?corp=${encodeURIComponent(name)}`);
    const clusters = await res.json();
    
    feedEl.innerHTML = '';
    
    if (clusters.length === 0) {
      feedEl.innerHTML = '<p class="text-slate-400">No active clusters found for this jurisdiction.</p>';
      return;
    }
    
    clusters.forEach(c => {
      let color = '#3b82f6';
      if (c.priorityScore >= 90) color = '#ef4444';
      else if (c.priorityScore >= 75) color = '#f97316';
      else if (c.priorityScore >= 50) color = '#eab308';
      
      const el = document.createElement('div');
      el.className = 'problem-card';
      el.style.borderLeftColor = color;
      
      el.innerHTML = `
        <div class="flex justify-between items-start mb-2">
          <h4 class="text-lg font-bold text-white">${c.title}</h4>
          <span class="badge" style="background: rgba(255,255,255,0.1); color: ${color}; border: 1px solid ${color};">${c.priorityScore} Priority</span>
        </div>
        <p class="text-sm text-slate-400 mb-2">Status: <strong class="uppercase">${c.status.replace('_', ' ')}</strong> &bull; Citizen Reports: ${c._count.complaints}</p>
        ${c.probableRootCause ? `
          <div style="background: rgba(0,0,0,0.2); padding: 0.75rem; border-radius: 4px; border-left: 2px solid #8b5cf6;">
            <div class="text-xs font-bold text-purple-400 uppercase mb-1">AI Root Cause Prediction</div>
            <div class="text-sm text-slate-300">${c.probableRootCause}</div>
          </div>
        ` : ''}
      `;
      feedEl.appendChild(el);
    });
    
  } catch (err) {
    feedEl.innerHTML = '<p class="text-red-500">Failed to load problem clusters.</p>';
  }
}

// AI Button Logic
document.getElementById('generate-ai-btn').addEventListener('click', async () => {
  if (!currentCorpData) return;
  const name = currentCorpData._id.corp;
  
  const btn = document.getElementById('generate-ai-btn');
  const reviewBox = document.getElementById('ai-review-box');
  const reviewText = document.getElementById('ai-review-text');
  
  btn.disabled = true;
  btn.innerHTML = 'Analyzing performance metrics...';
  reviewBox.style.display = 'block';
  reviewText.textContent = 'Contacting Groq AI...';
  
  try {
    const res = await fetch(`/api/analytics/recommendation/${encodeURIComponent(name)}`);
    const data = await res.json();
    reviewText.textContent = data.recommendation || "No recommendation available.";
  } catch (err) {
    reviewText.textContent = "AI generation failed. Please try again later.";
  }
  
  btn.disabled = false;
  btn.innerHTML = 'Refresh AI Recommendation';
});


// --- MAP LOGIC ---

function initMap() {
  mapInstance = L.map('state-map', { zoomControl: false }).setView([26.8467, 80.9462], 7);
  L.control.zoom({ position: 'bottomright' }).addTo(mapInstance);

  const tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  L.tileLayer(tileUrl, { attribution: '&copy; OpenStreetMap' }).addTo(mapInstance);

  const tilePane = mapInstance.getPane('tilePane');
  tilePane.style.filter = 'invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%)';
  
  // Initial render for 'All'
  renderMapData('All');
}

function renderMapData(filterTier) {
  if (!mapInstance) return;
  
  // Clear existing
  mapMarkers.forEach(m => mapInstance.removeLayer(m));
  mapCircles.forEach(c => mapInstance.removeLayer(c));
  mapMarkers = [];
  mapCircles = [];
  
  const bounds = L.latLngBounds();
  let addedPoints = 0;
  
  hierarchyData.forEach(corp => {
    if (!corp._id || !corp._id.type || !corp._id.corp) return;
    const type = corp._id.type;
    const name = corp._id.corp;
    
    if (filterTier !== 'All' && type !== filterTier) return;
    
    const coords = corpCoords[name] || [26.8467, 80.9462]; // fallback to Lucknow if unknown
    
    // Color logic
    let areaColor = '#3b82f6'; // Good
    if (corp.criticalClusters > 0) areaColor = '#ef4444'; // Critical
    else if (corp.pendingClusters > corp.resolvedClusters) areaColor = '#f59e0b'; // Needs attention
    
    // Radius logic based on tier
    let radius = 5000; // default
    if (type === 'Nagar Nigam') radius = 15000;
    else if (type === 'Nagar Palika Parishad') radius = 8000;
    else if (type === 'Nagar Panchayat') radius = 3000;
    
    const circle = L.circle(coords, {
      color: areaColor,
      fillColor: areaColor,
      fillOpacity: 0.15,
      weight: 2,
      dashArray: '5, 10',
      radius: radius
    }).addTo(mapInstance);
    
    const marker = L.circleMarker(coords, {
      radius: type === 'Nagar Nigam' ? 8 : (type === 'Nagar Palika Parishad' ? 6 : 4),
      color: '#fff',
      weight: 2,
      fillColor: areaColor,
      fillOpacity: 1
    }).addTo(mapInstance).bindTooltip(`<b>${name}</b><br><span style="font-size:10px; color:#94a3b8">${type}</span><br>Pending: ${corp.pendingClusters}`, { direction: 'top', className: 'bg-slate-800 text-white border-slate-700' });
    
    mapCircles.push(circle);
    mapMarkers.push(marker);
    bounds.extend(coords);
    addedPoints++;
  });
  
  if (addedPoints > 0) {
    mapInstance.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
  }
}
