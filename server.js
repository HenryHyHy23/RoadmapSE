const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
require('dotenv').config();
const app = express();

app.use(cors());
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

app.use(express.json());
const PORT = process.env.PORT || 3000;

// --- CẤU HÌNH KẾT NỐI AIVEN ---
const dbConfig = {
    host: process.env.DB_HOST,     
    port: process.env.DB_PORT,      
    user: process.env.DB_USER,      
    password: process.env.DB_PASSWORD, 
    database: process.env.DB_NAME,  
    ssl: { rejectUnauthorized: false },
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

app.get('/', (req, res) => {
    res.json({ 
        message: 'CapMotSach API is running!',
        endpoints: {
            initDB: '/init-db',
            quiz: '/api/quiz/:category',
            feedback: '/feedback'
        }
    });
});


app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK' });
});

app.get('/init-db', async (req, res) => {
    try {
        const connection = await pool.getConnection();
        
        await connection.query('DROP TABLE IF EXISTS Questions');
        await connection.query('DROP TABLE IF EXISTS Feedback');
        await connection.query(`
            CREATE TABLE Questions (
                id INT PRIMARY KEY AUTO_INCREMENT,
                category VARCHAR(10),
                question_text TEXT NOT NULL,
                option_a VARCHAR(255),
                option_b VARCHAR(255),
                option_c VARCHAR(255),
                option_d VARCHAR(255),
                correct_answer CHAR(1),
                explanation TEXT
            )
        `);

        await connection.query(`
            CREATE TABLE Feedback (
                id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(100),
                phone VARCHAR(20),
                message TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
      
        const sqlInsert = `
            INSERT INTO Questions (category, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation) 
            VALUES ?`;
        
        const values = [
            // === JPD (TIẾNG NHẬT) - 20 Câu ===
            ['JPD', 'Chữ cái "あ" đọc là gì?', 'A', 'I', 'U', 'E', 'A', 'Trong bảng Hiragana, "あ" là nguyên âm đầu tiên, phát âm là "A".'],
            ['JPD', 'Nghĩa của từ "Arigatou"?', 'Xin chào', 'Tạm biệt', 'Cảm ơn', 'Xin lỗi', 'C', '"Arigatou" (ありがとう) dùng để nói lời cảm ơn thông thường.'],
            ['JPD', 'Số 1 trong tiếng Nhật là?', 'Ichi', 'Ni', 'San', 'Yon', 'A', 'Số đếm: 1-Ichi, 2-Ni, 3-San, 4-Yon/Shi.'],
            ['JPD', 'Buổi sáng chào thế nào?', 'Konbanwa', 'Konnichiwa', 'Oyasumi', 'Ohayou', 'D', 'Ohayou là chào buổi sáng. Konnichiwa là chào buổi trưa/chiều.'],
            ['JPD', 'Chữ "Sensei" nghĩa là gì?', 'Học sinh', 'Giáo viên', 'Bác sĩ', 'Nhân viên', 'B', 'Sensei (tiên sinh) thường dùng để gọi giáo viên, bác sĩ.'],
            ['JPD', 'Màu đỏ tiếng Nhật là?', 'Shiro', 'Kuro', 'Aka', 'Ao', 'C', 'Aka (赤) là màu đỏ. Shiro (trắng), Kuro (đen), Ao (xanh).'],
            ['JPD', 'Từ "Watashi" nghĩa là?', 'Bạn', 'Tôi', 'Anh ấy', 'Cô ấy', 'B', 'Watashi (私) là đại từ nhân xưng ngôi thứ nhất phổ biến nhất.'],
            ['JPD', 'Số 10 tiếng Nhật?', 'Roku', 'Nana', 'Hachi', 'Juu', 'D', 'Số 10 đọc là Juu (十).'],
            ['JPD', 'Tạm biệt là?', 'Sayounara', 'Sumimasen', 'Gomen', 'Hajimemashite', 'A', 'Sayounara là tạm biệt (lâu ngày không gặp).'],
            ['JPD', '"Mizu" nghĩa là gì?', 'Cơm', 'Nước', 'Trà', 'Bánh', 'B', 'Mizu (水) nghĩa là nước uống.'],
            ['JPD', '"Hon" nghĩa là gì?', 'Sách', 'Vở', 'Bút', 'Thước', 'A', 'Hon (本) nghĩa là sách.'],
            ['JPD', 'Khẳng định "Vâng/Có"?', 'Iie', 'Hai', 'Eeto', 'Ano', 'B', 'Hai (はい) nghĩa là Vâng/Có.'],
            ['JPD', 'Phủ định "Không"?', 'Hai', 'Sou', 'Iie', 'Ne', 'C', 'Iie (いいえ) nghĩa là Không.'],
            ['JPD', 'Con mèo tiếng Nhật?', 'Inu', 'Tori', 'Sakana', 'Neko', 'D', 'Neko (猫) là con mèo. Inu là con chó.'],
            ['JPD', 'Động từ "Ăn"?', 'Nomimasu', 'Tabemasu', 'Mimasu', 'Ikimasu', 'B', 'Tabemasu (食べます) là Ăn.'],
            ['JPD', 'Hôm nay là?', 'Kyou', 'Ashita', 'Kinou', 'Asatte', 'A', 'Kyou (今日) là hôm nay.'],
            ['JPD', 'Thứ 2 tiếng Nhật?', 'Getsuyoubi', 'Kayoubi', 'Suiyoubi', 'Mokuyoubi', 'A', 'Getsuyoubi (月曜日) là thứ Hai.'],
            ['JPD', 'Trợ từ chỉ chủ ngữ?', 'Wo', 'Ni', 'Wa', 'De', 'C', 'Trợ từ Wa (は) dùng để xác định chủ ngữ.'],
            ['JPD', 'Đuôi câu hỏi trong tiếng Nhật?', 'Ne', 'Yo', 'Ka', 'Mo', 'C', 'Ka (か) đặt cuối câu để tạo thành câu hỏi.'],
            ['JPD', '"Oishii" nghĩa là?', 'Dở', 'Ngon', 'Đắt', 'Rẻ', 'B', 'Oishii (美味しい) nghĩa là ngon.'],
            ['JPD', 'Tháng 4 trong tiếng Nhật được đọc là gì?', 'しちがつ (shichigatsu)', 'しがつ (shigatsu)', 'くがつ (kugatsu)', 'いちがつ (ichigatsu)', 'B', 'Tháng 4 có cách đọc đặc biệt là しがつ (shigatsu).'],
            ['JPD', 'Cách nói "Hôm nay là ngày mấy?" trong tiếng Nhật là gì?', 'なんにちですか ?', 'なんがつですか ?', 'なんようびですか ?', 'いま、なんじですか ?', 'A', 'なんにちですか ? là câu hỏi hỏi về ngày trong tháng.'],
            ['JPD', 'Từ nào sau đây có nghĩa là "Thứ Sáu"?', 'もくようび (mokuyōbi)', 'きんようび (kinyōbi)', 'どようび (doyōbi)', 'かようび (kayōbi)', 'B', 'Thứ Sáu là きんようび, dựa trên yếu tố Kim.'],
            ['JPD', 'Khi muốn hỏi "Bây giờ là mấy giờ?" một cách lịch sự, bạn nói gì?', 'なんじですか ?', 'なんがつですか ?', 'なんんにちですか ?', 'なんようびですか ?', 'A', 'Câu hỏi về giờ giấc sử dụng なんじですか ?'],
            ['JPD', 'Số 300 trong tiếng Nhật đọc như thế nào?', 'さんびゃく (sanbyaku)', 'さんひゃく (sanhyaku)', 'さんぜん (sanzen)', 'さんびゃく (sambyaku)', 'A', '300 có cách đọc đặc biệt là さんびゃく (sanbyaku).'],
            ['JPD', 'Từ nào dùng để hỏi về giá cả?', 'どちら (dochira)', 'だれの (dare no)', 'いくら (ikura)', 'なんの (nan no)', 'C', 'いくら có nghĩa là "bao nhiêu tiền".'],
            ['JPD', 'Khi muốn nói "Cái này là sách" một cách lịch sự, bạn nói gì?', 'これはほんです。', 'これはほんだ。', 'それれはほんです。', 'あれはほんです。', 'A', 'Cấu trúc cơ bản là [Danh từ] です。 Trong đó, です thể hiện sự lịch sự.'],
            ['JPD', 'Trợ từ nào được dùng để kết nối hai danh từ với ý nghĩa "và"?', 'から (kara)', 'で (de)', 'と (to)', 'へ (e)', 'C', 'Trợ từ と dùng để liệt kê danh từ, có nghĩa là "và".'],
            ['JPD', 'Cách nói "Tôi ăn cơm lúc 7 giờ." là gì?', '7 じにごはんをたべます。', '7 じにごはんをたべました。', '7 じからごはんをたべます。', '7 じまでごはんをたべます. ', 'A', 'Trợ từ に dùng để chỉ thời điểm cụ thể thực hiện hành động. Thể ます dùng cho hiện tại/tương lai.'],
            ['JPD', 'Muốn nói "Tôi đi học bằng xe đạp", bạn dùng cấu trúc nào?', 'じてんしゃにがっこうへいきます。', 'じてんしゃでがっこうへいきます。', 'じてんしゃがっこうへいきます。', 'じてんしゃをがっこうへいきます。', 'B', 'Trợ từ で chỉ phương tiện di chuyển.'],
            ['JPD', 'Câu "だいがくはどちらですか。" có nghĩa là gì?', 'Trường đại học của bạn là gì?', 'Trường đại học của bạn ở đâu?', 'Bạn học đại học chứ?', 'Bạn là sinh viên đại học?', 'B', 'どちら dùng để hỏi về địa điểm một cách lịch sự.'],
            ['JPD', 'Cách nói "Quê tôi là Việt Nam." là gì?', 'おくにはベトナムです。', 'くにはベトナムです. ', 'おくにはベトナムです。', 'くにはベトナムのです. ', 'A', 'Khi nói về quê hương, thường dùng tiền tố お (o) để thể hiện sự tôn trọng ( おくに ).'],
            ['JPD', 'Ngày 20 trong tháng được đọc là gì?', 'にじゅうにち (nijūnichinichi)', 'はつか (hatsuka)', 'にじゅうよっか (nijūyokka)', 'よっか (yokka)', 'B', 'Ngày 20 có cách đọc đặc biệt là はつか (hatsuka).'],
            ['JPD', 'Tháng 9 trong tiếng Nhật được viết bằng Kanji như thế nào?', '九月', '七月', '四月', '一月', 'A', 'Tháng 9 là 九月, đọc là くがつ (kugatsu).'],
            ['JPD', 'Khi muốn hỏi "Bạn bao nhiêu tuổi?" một cách lịch sự, bạn nói gì?', 'なんにちですか ?', 'なんさいですか ?', 'なんがつですか ?', 'なんじですか ?', 'B', 'なんさいですか ? là câu hỏi về tuổi tác.'],
            ['JPD', 'Cách đếm "1 tuổi" là gì?', 'いっさい (issai)', 'にさい (nisai)', 'さんさい (sansai)', 'よんさい (yonsai)', 'A', '1 tuổi có cách đọc đặc biệt là いっさい (issai).'],
            ['JPD', 'Từ nào dùng để nói "nơi này" một cách lịch sự?', 'ここ (koko)', 'こちら (kochira)', 'そこ (soko)', 'そちら (sochira)', 'B', 'こちら là cách nói lịch sự của ここ.'],
            ['JPD', 'Cấu trúc "A ですか B ですか。" dùng để làm gì?', 'Hỏi về thời gian', 'Hỏi lựa chọn giữa hai thứ', 'Hỏi về địa điểm', 'Hỏi về sở hữu', 'B', 'Cấu trúc này dùng để hỏi lựa chọn, có nghĩa "là A hay là B?".'],
            ['JPD', 'Từ nào điền vào chỗ trống: " これは ___ の ほんですか。 " (Cuốn sách này là của ai?)', 'なん (nan)', 'どこ (doko)', 'だれ (dare)', 'どちら (dochira)', 'C', 'だれの có nghĩa "của ai".'],
            ['JPD', 'Khi muốn nói "Tôi làm việc từ thứ Hai đến thứ Sáu", bạn dùng cấu trúc nào?', 'げつようびからきんようびまで はたらきます。', 'げつようびと きんようび はたらきます。', 'げつようびに きんようびに はたらきます。', 'げつようびまたは きんようび はたらきます。', 'A', 'から (từ) và まで (đến) dùng để chỉ khoảng thời gian liên tục.'],
            ['JPD', 'Trong câu "スーパーは地下一階です。" thì "地下一階" có nghĩa là gì?', 'Tầng một trên mặt đất', 'Tầng một dưới lòng đất', 'Tầng trệt', 'Tầng cao nhất', 'B', '地下 (chika) có nghĩa là "dưới lòng đất", 一階 là "tầng một".'],
            ['JPD', 'Số 8000 trong tiếng Nhật đọc như thế nào?', 'はっせん (hassen)', 'はちせん (hachisen)', 'はっぴゃく (happyaku)', 'はちひゃく (hachihyaku)', 'A', '8000 có cách đọc đặc biệt là はっせん (hassen).'],
            ['JPD', 'Khi muốn nói "Tôi không đi đâu cả (hôm qua).", bạn nói gì?', 'きのう どこも いきません。', 'きのう どこも いきませんでした。', 'きのう どこへも いきません。', 'きのう どこかへ いきませんでした。', 'B', 'どこも + động từ phủ định thể quá khứ ませんでした diễn tả "đã không đi đâu cả".'],
            ['JPD', 'Từ nào dùng để hỏi về chủng loại?', 'だれの (dare no)', 'なんの (nan no)', 'どこの (doko no)', 'いくらの (ikura no)', 'B', 'なんの dùng để hỏi "loại gì", "thể loại gì".'],
            ['JPD', 'Khi nói "Tôi đi siêu thị với bạn.", trợ từ nào được dùng trước "bạn"?', 'に (ni)', 'で (de)', 'と (to)', 'へ (e)', 'C', 'Trợ từ と dùng để chỉ "cùng với" ai đó.'],
            ['JPD', 'Cách nói "5 phút" trong tiếng Nhật là gì?', 'ごふん (gofun)', 'ごぷん (gopun)', 'ごふん (gohun)', 'ごぷん (gopun)', 'A', '5 分 đọc là ごふん. Phút đi sau số 5 dùng ふん (fun).'],
            ['JPD', 'Câu "がっこうは 9 じから 3 じまでです。" có nghĩa là gì?', 'Trường học bắt đầu lúc 9 giờ.', 'Trường học kết thúc lúc 3 giờ.', 'Trường học mở cửa từ 9 giờ đến 3 giờ.', 'Trường học đóng cửa lúc 3 giờ.', 'C', 'から (từ) và まで (đến) chỉ khoảng thời gian hoạt động.'],
            ['JPD', 'Từ nào sau đây là cách nói lịch sự của "nơi đó"?', 'そこ (soko)', 'そちら (sochira)', 'あそこ (asoko)', 'あちら (achira)', 'B', 'そちら là cách nói lịch sự của そこ.'],
            ['JPD', 'Khi muốn nói "Tôi đã uống cà phê.", bạn dùng thể nào của động từ?', 'のみます (nomimasu)', 'のみません (nomimasen)', 'のみました (nomimashita)', 'のみませんでした (nomimasen deshita)', 'C', 'Thể ました diễn tả hành động đã xảy ra trong quá khứ.'],
            ['JPD', 'Cấu trúc "~ や ~ など " dùng để làm gì?', 'Liệt kê đầy đủ tất cả', 'Liệt kê một vài ví dụ tiêu biểu', 'So sánh hai thứ', 'Phủ định một danh sách', 'B', 'や và など dùng để liệt kê một vài ví dụ, ngụ ý còn nhiều thứ khác nữa.'],
            ['JPD', 'Ngày 4 trong tháng được đọc là gì?', 'よっか (yokka)', 'ようか (yōka)', 'みっか (mikka)', 'むいか (muika)', 'A', 'Ngày 4 có cách đọc đặc biệt là よっか (yokka).'],
            ['JPD', 'Khi muốn hỏi "Cái túi này giá bao nhiêu?", bạn nói gì?', 'このかばんはだれのですか。', 'このかばんはどこのですか。', 'このかばんはなんのですか. ', 'このかばんはいくらですか。', 'D', 'いくらですか dùng để hỏi giá cả.'],
            ['JPD', 'Cách nói "Tầng 3" của một tòa nhà là gì?', 'さんかい (sankai)', 'さんがい (sangai)', 'よんかい (yonkai)', 'にかい (nikai)', 'B', 'Tầng 3 có cách đọc đặc biệt là さんがい (sangai).'],
            ['JPD', 'Số 600 trong tiếng Nhật đọc như thế nào?', 'ろっぴゃく (roppyaku)', 'ろくひゃく (rokuhyaku)', 'さんびゃく (sanbyaku)', 'はっぴゃく (happyaku)', 'A', '600 có cách đọc đặc biệt là ろっぴゃく (roppyaku).'],
            ['JPD', 'Trong câu "これはどこのかみですか。", từ "どこの" có nghĩa là gì?', 'Của ai', 'Của nước nào', 'Giá bao nhiêu', 'Loại gì', 'B', 'どこの hỏi về xuất xứ, nguồn gốc (của nước nào).'],
            ['JPD', 'Khi muốn nói "Tôi đi về nhà.", bạn nói gì?', 'うちへいきます。', 'うちへかえります。', 'うちにいきます。', 'うちにかえります。', 'B', 'かえります có nghĩa là "trở về". Trợ từ へ chỉ hướng về địa điểm.'],
            ['JPD', 'Từ nào dùng để nói "cái kia" (đứng trước danh từ)?', 'あれ (are)', 'あの (ano)', 'それ (sore)', 'その (sono)', 'B', 'あの phải đi kèm với một danh từ phía sau.'],
            ['JPD', 'Cách nói "3 giờ rưỡi" là gì?', 'さんじはん (sanji han)', 'さんじ (sanji)', 'さんじゅうふん (sanjuppun)', 'さんじはん (sanji han)', 'D', '半 ( はん - han) có nghĩa là "rưỡi", "nửa".'],
            ['JPD', 'Khi muốn hỏi "Bạn đi Nhật Bản khi nào?", bạn nói gì?', 'いつにhonへいきますか。', 'どこにhonへいきますか。', 'だれにhonへいきますか。', 'なににhonへいきますか。', 'A', 'いつ có nghĩa "khi nào".'],
            ['JPD', 'Tháng 7 trong tiếng Nhật được đọc là gì?', 'しがつ (shigatsu)', 'しちがつ (shichigatsu)', 'くがつ (kugatsu)', 'はちがつ (hachigatsu)', 'B', 'Tháng 7 có cách đọc đặc biệt là しちがつ (shichigatsu).'],
            ['JPD', 'Cách nói "10 tuổi" là gì?', 'じゅっさい (jussai)', 'じゅうさい (jūsai)', 'とおさい (tōsai)', 'いっさい (issai)', 'A', '10 tuổi có cách đọc đặc biệt là じゅっさい (jussai).'],
            ['JPD', 'Khi muốn nói "Trong cặp có sách, vở, vân vân.", bạn dùng cấu trúc nào?', 'かばんの中にほんとノートがあります。', 'かばんの中にほんやノートなどがあります。', 'かばんの中にほんかノートがあります。', 'かばんの中にほんのノートがあります。', 'B', 'や và など dùng để liệt kê mang tính ví dụ, không đầy đủ.'],
            ['JPD', 'Từ nào điền vào chỗ trống: "___ は えいご で "Thank you" です。 " (___ trong tiếng Anh là "Thank you".)', '「さようなら」', '「ありがとう」', '「こんにちは」', '「すみません」', 'B', '「ありがとう」 có nghĩa là "cảm ơn", tương đương "Thank you".'],
            ['JPD', 'Câu "ともだちと こうえんへ 行きます。" có nghĩa là gì?', 'Tôi đi công viên.', 'Tôi đi công viên với bạn.', 'Bạn tôi đi công viên.', 'Tôi và bạn tôi đi công viên.', 'D', 'Trợ từ と có nghĩa "cùng với". Chủ ngữ thường là "tôi" nếu không được nêu rõ.'],
            ['JPD', 'Cách nói "Tôi đã không ăn." là gì?', 'たべました。', 'たべません。', 'たべませんでした。', 'たべます。', 'C', 'Thể phủ định quá khứ của động từ là V ませんでした .'],
            ['JPD', 'Khi muốn hỏi "Cái này là tạp chí về cái gì?", bạn nói gì?', 'これはなんのざっしですか。', 'これはだれのざっしですか。', 'これはどこのざっしですか。', 'これはいくらのざっしですか。', 'A', 'なんの dùng để hỏi về thể loại, chủ đề.'],
            ['JPD', 'Số 1,000,000 (một triệu) trong tiếng Nhật đọc như thế nào?', 'ひゃくまん (hyakuman)', 'せんまん (senman)', 'いちまん (ichiman)', 'じゅうまん (jūman)', 'A', '1,000,000 là 百万 ( ひゃくまん - hyakuman).'],
            ['JPD', 'Ngày 14 trong tháng được đọc là gì?', 'じゅうよっか (jūyokka)', 'じゅうよんにち (jūyonnichi)', 'じゅうしにち (jūshinichi)', 'じゅうよんか (jūyonka)', 'A', 'Ngày 14 có cách đọc đặc biệt là じゅうよっか (jūyokka).'],
            ['JPD', 'Khi muốn nói "Sayounara trong tiếng Việt là Tam biệt.", bạn dùng cấu trúc nào?', '「さようなら」はベトナムごで「 Tam biệt 」です。', '「さようなら」はベトナムごの「 Tam biệt 」です。', '「さようなら」はベトナムごを「 Tam biệt 」です。', '「さようなら」はベトナムごと「 Tam biệt 」です。', 'A', 'Cấu trúc: 「 Từ 」は [Ngôn ngữ] で 「 Nghĩa 」です。'],
            ['JPD', 'Từ nào dùng để hỏi về địa điểm một cách lịch sự?', 'どこ (doko)', 'どちら (dochira)', 'だれ (dare)', 'なん (nan)', 'B', 'どちら là cách hỏi lịch sự hơn どこ.'],
            ['JPD', 'Cách nói "8 giờ tối" là gì?', 'ごぜんはちじ (gozen hachiji)', 'ごごはちじ (gogo hachiji)', 'よるはちじ (yoru hachiji)', 'ばんはちじ (ban hachiji)', 'B', '午後 ( ごご ) dùng cho p.m. (sau 12h trưa).'],
            ['JPD', 'Khi muốn nói "Ngày nghỉ là thứ Bảy và Chủ Nhật.", bạn dùng trợ từ nào để nối?', 'から (kara)', 'まで (made)', 'と (to)', 'や (ya)', 'C', 'Trợ từ と dùng để liệt kê danh từ đầy đủ, có nghĩa "và".'],
            ['JPD', 'Cách nói "Tôi đi bộ." là gì?', 'あるいて いきます。', 'あるき いきます。', 'あるく いきます. ', 'あるか いきます. ', 'A', 'あるいて là thể て của động từ あるく (đi bộ), dùng để chỉ phương thức di chuyển.'],
            ['JPD', 'Số 20 tuổi có cách đọc đặc biệt là gì?', 'にじゅっさい (nijussai)', 'はたち (hatachi)', 'にじゅうさい (nijūsai)', 'はつか (hatsuka)', 'B', '20 tuổi được coi là tuổi trưởng thành và có cách đọc đặc biệt はたち (hatachi).'],
            ['JPD', 'Khi muốn nói "Thư viện mở cửa từ 10 giờ sáng đến 6 giờ tối.", bạn dùng cấu trúc nào?', 'としょかんは 10 じから 18 じまでです。', 'としょかんは 10 じと 18 じ입니다. ', 'としょかんは 10 じに 18 じにです. ', 'としょかんは 10 じや 18 じ입니다. ', 'A', 'から (từ) và まで (đến) diễn tả khoảng thời gian.'],
            ['JPD', 'Từ nào sau đây là cách nói lịch sự của "nơi kia"?', 'あそこ (asoko)', 'あちら (achira)', 'そこ (soko)', 'そちら (sochira)', 'B', 'あちら là cách nói lịch sự của あそこ.'],
            ['JPD', 'Cách nói "15 phút" trong tiếng Nhật là gì?', 'じゅうごふん (jūgofun)', 'じゅうごぷん (jūgopun)', 'じゅうごふん (jūgohun)', 'じゅうごぷん (jūgopun)', 'A', '15 分 đọc là じゅうごふん. Phút đi sau số 5 dùng ふん (fun).'],
            ['JPD', 'Câu "きのう どこも いきませんでした。" có nghĩa là gì?', 'Hôm qua tôi đã đi đâu đó.', 'Hôm qua tôi không đi đâu cả.', 'Hôm qua tôi sẽ không đi đâu.', 'Hôm qua tôi đã đi nhiều nơi.', 'B', 'どこも + động từ phủ định quá khứ có nghĩa "đã không đi đâu cả".'],
            ['JPD', 'Khi muốn hỏi "Chiếc xe này là của nước nào?", bạn nói gì?', 'このくるまはどこのですか。', 'このくるまはだれのですか。', 'このくるまはなんのですか. ', 'このくるまはいくらのですか. ', 'A', 'どこの hỏi về xuất xứ (của nước nào).'],
            ['JPD', 'Tầng 10 có cách đọc đặc biệt là gì?', 'じゅっかい (jukkai)', 'じゅうかい (jūkai)', 'とおかい (tōkai)', 'いっかい (ikkai)', 'A', 'Tầng 10 có cách đọc đặc biệt là じゅっかい (jukkai).'],


            // === MAS (XÁC SUẤT) - 20 Câu ===
            ['MAS', 'Xác suất tung đồng xu ngửa?', '25%', '50%', '75%', '100%', 'B', 'Đồng xu có 2 mặt, xác suất là 1/2.'],
            ['MAS', 'Median của {1, 3, 5} là?', '1', '3', '5', '9', 'B', 'Median là số ở giữa của dãy đã sắp xếp.'],
            ['MAS', 'Ký hiệu σ (Sigma) là?', 'Trung bình', 'Phương sai', 'Độ lệch chuẩn', 'Mốt', 'C', 'Sigma (σ) là độ lệch chuẩn.'],
            ['MAS', 'Tổng xác suất mọi biến cố?', '0', '0.5', '1', '100', 'C', 'Tổng xác suất không gian mẫu luôn bằng 1.'],
            ['MAS', 'Xúc xắc có mấy mặt?', '4', '6', '8', '12', 'B', 'Xúc xắc chuẩn có 6 mặt.'],
            ['MAS', 'P(A) + P(not A) = ?', '0', '0.5', '1', '2', 'C', 'Biến cố và biến cố đối luôn có tổng xác suất là 1.'],
            ['MAS', 'Mode của {2, 4, 4, 6}?', '2', '4', '6', '10', 'B', 'Mode (Mốt) là giá trị xuất hiện nhiều nhất.'],
            ['MAS', 'Mean của {2, 4} là?', '2', '3', '4', '6', 'B', 'Mean = (2+4)/2 = 3.'],
            ['MAS', 'Xác suất P(E) nằm trong?', '[-1, 1]', '[0, 1]', '[0, 100]', '(-∞, +∞)', 'B', 'Xác suất luôn nằm trong đoạn [0, 1].'],
            ['MAS', 'Công thức chỉnh hợp?', 'nCr', 'nPr', 'n!', 'n^2', 'B', 'Chỉnh hợp là nPr (Permutation).'],
            ['MAS', 'Hai biến cố độc lập P(AB)?', 'P(A)+P(B)', 'P(A)-P(B)', 'P(A).P(B)', 'P(A)/P(B)', 'C', 'Độc lập thì P(AB) = P(A) * P(B).'],
            ['MAS', 'Xác suất có điều kiện P(A|B)?', 'P(AB)/P(B)', 'P(AB)/P(A)', 'P(A)/P(B)', 'P(B)/P(A)', 'A', 'P(A|B) = P(A giao B) / P(B).'],
            ['MAS', 'Phương sai là bình phương của?', 'Mean', 'Median', 'Mode', 'Std Dev', 'D', 'Var = SD^2.'],
            ['MAS', 'Phân phối chuẩn hình gì?', 'Vuông', 'Tròn', 'Chuông', 'Tam giác', 'C', 'Bell-shaped curve (hình chuông).'],
            ['MAS', 'Trung bình chuẩn tắc?', '0', '1', '10', '100', 'A', 'Phân phối chuẩn tắc có Mean = 0.'],
            ['MAS', 'Độ lệch chuẩn chuẩn tắc?', '0', '1', '0.5', '2', 'B', 'Phân phối chuẩn tắc có SD = 1.'],
            ['MAS', 'Biến cố chắc chắn có P=?', '0', '0.5', '0.99', '1', 'D', 'Chắc chắn xảy ra thì P=1.'],
            ['MAS', 'Biến cố không thể có P=?', '0', '1', '-1', '0.1', 'A', 'Không thể xảy ra thì P=0.'],
            ['MAS', 'Tập hợp rỗng ký hiệu?', '{}', '[]', '()', '<>', 'A', '{} hoặc Ø.'],
            ['MAS', 'A giao B = rỗng là?', 'Độc lập', 'Xung khắc', 'Đối lập', 'Tương đương', 'B', 'Xung khắc (Mutually Exclusive) nghĩa là không thể cùng xảy ra.'],
            ['MAS', 'Điều nào sau đây định nghĩa đúng nhất Population trong statistics?', 'Một tập con của dữ liệu quan sát', 'Tất cả các cá thể được quan tâm trong một nghiên cứu', 'Một bản tóm tắt số của một sample', 'Một random variable', 'B', 'Population đề cập đến toàn bộ nhóm được quan tâm.'],
            ['MAS', 'Thước đo nào mô tả một sample?', 'Parameter', 'Census', 'Statistic', 'Population', 'C', 'Một statistic tóm tắt dữ liệu sample.'],
            ['MAS', 'Nghiên cứu nào chỉ quan sát mà không có can thiệp?', 'Experiment', 'Case study', 'Designed study', 'Observational study', 'D', 'Không có treatment nào được áp dụng trong observational study.'],
            ['MAS', 'Loại dữ liệu nào biểu diễn height?', 'Discrete', 'Categorical', 'Continuous', 'Qualitative', 'C', 'Height có thể nhận bất kỳ giá trị thực nào.'],
            ['MAS', 'Phân phối nào mô hình hóa số lần thành công trong số lần thử cố định?', 'Poisson', 'Geometric', 'Normal', 'Binomial', 'D', 'Binomial mô hình hóa số lần thành công trong n lần thử.'],
            ['MAS', 'Mean của một discrete random variable bằng?', '∑xi', '∑P(x)', '∑xiP(xi)', '∑(xi−μ)', 'C', 'Công thức expected value.'],
            ['MAS', 'Variance đo lường điều gì?', 'Central tendency', 'Spread', 'Skewness', 'Correlation', 'B', 'Variance đo độ phân tán.'],
            ['MAS', 'Nếu A và B independent, P(A∩B)=?', 'P(A)+P(B)', 'P(A)−P(B)', 'P(A)P(B)', 'P(A|B)', 'C', 'Quy tắc independence.'],
            ['MAS', 'Dữ liệu nào là discrete?', 'Temperature', 'Weight', 'Time', 'Number of students', 'D', 'Students có thể đếm được.'],
            ['MAS', 'CDF biểu diễn?', 'P(X≥x)', 'P(X=x)', 'P(X≤x)', 'Density', 'C', 'Định nghĩa của cumulative distribution.'],
            ['MAS', 'Phân phối nào có mean = variance?', 'Binomial', 'Poisson', 'Normal', 'Uniform', 'B', 'Tính chất của Poisson.'],
            ['MAS', 'Standard normal distribution có mean là?', '1', '0', 'σ', 'μ', 'B', 'Mean của Z distribution là 0.'],
            ['MAS', 'Dữ liệu nào là qualitative?', 'Height', 'Income', 'Eye color', 'Age', 'C', 'Eye color là categorical.'],
            ['MAS', 'Phương pháp sampling nào cho cơ hội bằng nhau?', 'Stratified', 'Cluster', 'Random', 'Systematic', 'C', 'Random sample.'],
            ['MAS', 'Nghiên cứu nào xem lại hồ sơ trong quá khứ?', 'Prospective', 'Cross-sectional', 'Retrospective', 'Experiment', 'C', 'Sử dụng dữ liệu lịch sử.'],
            ['MAS', 'Cái nào mô tả range?', 'Average', 'Max−min', 'Variance', 'Median', 'B', 'Công thức range.'],
            ['MAS', 'Hypergeometric khác Binomial vì?', 'No replacement', 'Continuous', 'Large n', 'Normality', 'A', 'Lấy mẫu không hoàn lại.'],
            ['MAS', 'Cái nào là parameter?', 'Sample mean', 'Sample variance', 'Population mean', 'Sample proportion', 'C', 'Thước đo của population.'],
            ['MAS', 'Cái nào là probability density?', 'P(X=x)', 'f(x)', 'F(x)', 'σ²', 'B', 'Hàm density.'],
            ['MAS', 'Geometric distribution mô hình hóa?', 'Time to first success', 'Total successes', 'Failures only', 'Continuous time', 'A', 'Đếm số lần thử cho đến thành công đầu tiên.'],
            ['MAS', 'Kiểm định nào dùng t distribution?', 'Known variance', 'Large sample', 'Small sample unknown variance', 'Proportion test', 'C', 't-test khi σ không biết và n nhỏ.'],
            ['MAS', 'Cái nào mô tả experiment?', 'Observe traffic', 'Survey opinion', 'Apply drug', 'Review records', 'C', 'Có áp dụng treatment.'],
            ['MAS', 'Mean của continuous uniform là?', '(a+b)/2', 'ab', 'a−b', '(b−a)/2', 'A', 'Công thức mean của uniform.'],
            ['MAS', 'Thước đo nào xác định trung tâm?', 'Range', 'Variance', 'Mean', 'Skewness', 'C', 'Mean là central tendency.'],
            ['MAS', 'Quy tắc nào tìm P(A|B)?', 'P(A)/P(B)', 'P(A∩B)', 'P(A∩B)/P(B)', 'P(B)/P(A)', 'C', 'Công thức conditional probability.'],
            ['MAS', 'Biểu đồ nào tốt nhất cho qualitative data?', 'Histogram', 'Boxplot', 'Scatterplot', 'Bar chart', 'D', 'Bar chart hiển thị các category.'],
            ['MAS', 'Statistic nào ít bị ảnh hưởng bởi outliers?', 'Mean', 'Median', 'Variance', 'Range', 'B', 'Median ít bị ảnh hưởng.'],
            ['MAS', 'Normal distribution là?', 'Symmetric', 'Right-skewed', 'Discrete', 'Uniform', 'A', 'Hình chuông đối xứng.'],
            ['MAS', 'Cái nào là empirical model?', 'Physics equation', 'Statistical regression', 'Chemical law', 'Newton model', 'B', 'Dựa trên mô hình dữ liệu.'],
            ['MAS', 'Cái nào đo mối quan hệ tuyến tính?', 'Mean', 'Variance', 'Correlation', 'Mode', 'C', 'Hệ số correlation.'],
            ['MAS', 'Phân phối của sampling distribution của mean là?', 'Original population', 'Uniform', 'Normal', 'Binomial', 'C', 'Central Limit Theorem.'],
            ['MAS', 'Cái nào là one-sided test?', 'α/2', 'Two tails', 'Only upper or lower', 'Confidence interval', 'C', 'Chỉ theo một hướng.'],
            ['MAS', 'Công thức nào cho binomial probability?', 'nCk p^k(1-p)', 'λ^k e^-λ', '1/(b−a)', '(1-p)^(k-1)', 'A', 'Hàm pmf của binomial.'],
            ['MAS', 'Statistic nào ước lượng population variance?', 'σ²', 's²', 'μ', 'x̄', 'B', 'Sample variance.'],
            ['MAS', 'Cái nào là continuous?', 'Number of calls', 'Height', 'Defects', 'Students', 'B', 'Giá trị đo lường.'],
            ['MAS', 'Phân phối nào xấp xỉ binomial?', 'Poisson', 'Uniform', 'Normal', 'Geometric', 'C', 'Khi n lớn.'],
            ['MAS', 'Null hypothesis là gì?', 'Research claim', 'Alternative', 'Status quo', 'Confidence level', 'C', 'Giả định mặc định.'],
            ['MAS', 'Scatterplot mô tả?', 'Category vs frequency', 'Two numeric variables', 'Time series', 'One variable', 'B', 'Hiển thị mối quan hệ.'],
            ['MAS', 'Thước đo nào dùng phần trăm?', 'Mean', 'Median', 'Quartile', 'Correlation', 'C', 'Quartile là percentile.'],
            ['MAS', 'Standard error là gì?', 'σ', 'σ²', 'σ/√n', 'n/σ', 'C', 'Công thức SE.'],
            ['MAS', 'Cái nào là case study?', 'Survey 1000 people', 'Test drug', 'Observe one patient', 'Random sample', 'C', 'Một đối tượng đơn lẻ được nghiên cứu chi tiết.'],
            ['MAS', 'Probability luôn nằm trong khoảng nào?', '0 and 2', '0 and 1', '−1 and 1', '1 and 10', 'B', 'Khoảng giá trị của probability.'],
            ['MAS', 'Cái nào là descriptive statistic?', 'Regression', 'Hypothesis test', 'Mean', 'Confidence interval', 'C', 'Tóm tắt dữ liệu.'],
            ['MAS', 'Cái nào là inferential?', 'Histogram', 'Median', 'Confidence interval', 'Mode', 'C', 'Suy luận về population.'],
            ['MAS', 'Standard deviation là gì?', '√variance', 'Variance²', 'Mean²', '1/variance', 'A', 'SD là căn bậc hai của variance.'],
            ['MAS', 'Thang đo dữ liệu nào là nominal?', 'Temperature', 'Income', 'Gender', 'Weight', 'C', 'Category không có thứ tự.'],
            ['MAS', 'Trường hợp nào dùng Z test?', 'Unknown σ, small n', 'Known σ', 'Qualitative', 'Regression slope', 'B', 'Z dùng khi variance đã biết.'],
            ['MAS', 'Cái nào là cumulative probability?', 'P(X=x)', 'f(x)', 'F(x)', 'σ', 'C', 'CDF.'],
            ['MAS', 'Tham số regression nào biểu diễn slope?', 'β0', 'β1', 'R', 'SSE', 'B', 'β1 là slope.'],
            ['MAS', 'Cái nào là coefficient of determination?', 'R', 'R²', 'β1', 'σ', 'B', 'R² giải thích mức độ biến thiên.'],
            
            // === DBI (DATABASE) - 20 Câu ===
            ['DBI', 'Lệnh xóa toàn bộ bảng?', 'DELETE', 'DROP', 'REMOVE', 'CLEAR', 'B', 'DROP TABLE xóa cả bảng và cấu trúc.'],
            ['DBI', 'SQL viết tắt của?', 'Structured Query Language', 'Simple Query List', 'Strong Question Language', 'Standard Query Link', 'A', 'Structured Query Language.'],
            ['DBI', 'Primary Key phải?', 'Duy nhất', 'Không NULL', 'Cả A và B', 'Tùy ý', 'C', 'PK phải Unique và Not Null.'],
            ['DBI', 'Lệnh lấy dữ liệu?', 'GET', 'FETCH', 'SELECT', 'PULL', 'C', 'SELECT là lệnh truy vấn.'],
            ['DBI', 'Quan hệ 1 SV - nhiều Môn?', '1-1', '1-N', 'N-N', 'Không xác định', 'C', 'Sinh viên - Môn học là quan hệ Nhiều - Nhiều.'],
            ['DBI', 'Lệnh thêm dòng mới?', 'ADD', 'INSERT INTO', 'UPDATE', 'NEW', 'B', 'INSERT INTO table_name VALUES...'],
            ['DBI', 'Lệnh sửa dữ liệu?', 'CHANGE', 'MODIFY', 'UPDATE', 'FIX', 'C', 'UPDATE table_name SET...'],
            ['DBI', 'Loại bỏ giá trị trùng?', 'UNIQUE', 'DIFFERENT', 'DISTINCT', 'SINGLE', 'C', 'SELECT DISTINCT...'],
            ['DBI', 'Sắp xếp giảm dần?', 'ASC', 'DESC', 'DOWN', 'LOW', 'B', 'DESC (Descending).'],
            ['DBI', 'Lọc nhóm dữ liệu?', 'WHERE', 'HAVING', 'GROUP BY', 'ORDER BY', 'B', 'HAVING dùng để lọc sau khi Group.'],
            ['DBI', 'Lọc dòng dữ liệu?', 'WHERE', 'HAVING', 'FILTER', 'SELECT', 'A', 'WHERE dùng lọc dòng cơ bản.'],
            ['DBI', 'Kết nối 2 bảng dùng?', 'LINK', 'CONNECT', 'JOIN', 'COMBINE', 'C', 'JOIN (Inner, Left, Right...).'],
            ['DBI', 'Khóa ngoại tham chiếu đến?', 'Unique Key', 'Primary Key', 'Index', 'View', 'B', 'Foreign Key tham chiếu đến Primary Key của bảng khác.'],
            ['DBI', 'Lệnh tạo bảng mới?', 'MAKE TABLE', 'NEW TABLE', 'CREATE TABLE', 'ADD TABLE', 'C', 'CREATE TABLE...'],
            ['DBI', 'Hàm đếm số lượng?', 'SUM', 'COUNT', 'TOTAL', 'NUM', 'B', 'COUNT(*).'],
            ['DBI', 'Hàm tính trung bình?', 'AVG', 'MEAN', 'MEDIAN', 'AVERAGE', 'A', 'AVG().'],
            ['DBI', 'Ký tự đại diện (Wildcard)?', '*', '&', '%', '#', 'C', '% đại diện cho chuỗi bất kỳ trong LIKE.'],
            ['DBI', 'Ràng buộc không rỗng?', 'UNIQUE', 'NOT NULL', 'CHECK', 'DEFAULT', 'B', 'NOT NULL.'],
            ['DBI', 'ERD là viết tắt?', 'Entity Relation Diagram', 'Entity Row Data', 'Entry Record Data', 'Entity Relationship Diagram', 'D', 'Sơ đồ thực thể kết hợp.'],
            ['DBI', 'Chuẩn hóa để?', 'Tăng tốc', 'Giảm dư thừa', 'Tăng dung lượng', 'Dễ code', 'B', 'Normalization giúp giảm dư thừa dữ liệu (Redundancy).'],
            ['DBI', 'Câu nào sau đây định nghĩa đúng nhất về một database?', 'Một tập hợp dữ liệu không liên quan', 'Một gói phần mềm để hỗ trợ việc tạo database', 'Một tập hợp thông tin tồn tại trong một khoảng thời gian dài', 'Phần mềm DBMS cùng với chính dữ liệu', 'C', 'Một database được định nghĩa là một tập hợp thông tin tồn tại trong một khoảng thời gian dài, thường được quản lý bởi một DBMS.'],
            ['DBI', 'Mục đích chính của một Database Management System (DBMS) là gì?', 'Tạo database mới và xác định schema của chúng', 'Cho phép người dùng truy vấn và thao tác dữ liệu', 'Hỗ trợ lưu trữ lượng lớn dữ liệu và đảm bảo durability', 'Tất cả các đáp án trên', 'D', 'Một DBMS được kỳ vọng cho phép tạo database, truy vấn, lưu trữ quy mô lớn, đảm bảo durability và kiểm soát truy cập đồng thời.'],
            ['DBI', 'Mô hình dữ liệu nào được sử dụng đầu tiên trong các DBMS trên mainframe thời kỳ đầu?', 'Network data model', 'Hierarchical data model', 'Relational model', 'Object-oriented model', 'B', 'Hierarchical data model, chẳng hạn như IMS của IBM, được sử dụng trong các DBMS trên mainframe thời kỳ đầu.'],
            ['DBI', 'Ai đã định nghĩa relational model vào những năm 1970?', 'Charles Bachman', 'Edgar Frank Codd', 'IBM researchers', 'CODASYL Consortium', 'B', 'Edgar Frank “Ted” Codd đã định nghĩa relational model dựa trên các relation vào những năm 1970.'],
            ['DBI', 'Normal form nào đảm bảo rằng tất cả các thuộc tính không khóa đều phụ thuộc hoàn toàn vào primary key?', '1NF', '2NF', '3NF', 'BCNF', 'B', 'Second Normal Form (2NF) yêu cầu rằng mọi thuộc tính không khóa phải phụ thuộc hoàn toàn vào primary key.'],
            ['DBI', 'Foreign key là gì?', 'Một thuộc tính định danh duy nhất một hàng trong một relation', 'Một cột trỏ đến primary key của một relation khác', 'Một tập thuộc tính có thể định danh duy nhất một tuple', 'Một thuộc tính được suy ra từ một thuộc tính khác', 'B', 'Foreign key là một cột trong một bảng tham chiếu đến primary key của một bảng khác.'],
            ['DBI', 'Ví dụ nào sau đây là một multi-valued attribute?', 'Employee ID', 'Employee Name', 'Phone Number (nếu một nhân viên có thể có nhiều số)', 'Date of Birth', 'C', 'Multi-valued attribute có thể lưu trữ nhiều hơn một giá trị cho một entity, chẳng hạn như nhiều số điện thoại.'],
            ['DBI', 'Trong relational algebra, phép toán selection (σ) thực hiện điều gì?', 'Chiếu các cột từ một relation', 'Chọn các hàng thỏa mãn một điều kiện cho trước', 'Thực hiện phép Cartesian product của hai relation', 'Đổi tên các thuộc tính của một relation', 'B', 'Selection (σ) chọn các tuple (hàng) từ một relation thỏa mãn một điều kiện xác định.'],
            ['DBI', 'Lệnh SQL nào được dùng để xóa một table khỏi database?', 'DELETE TABLE', 'DROP TABLE', 'REMOVE TABLE', 'ALTER TABLE DROP', 'B', 'Lệnh DROP TABLE được dùng để xóa một table và toàn bộ dữ liệu của nó khỏi database.'],
            ['DBI', 'Toán tử SQL LIKE với pattern "%Anh" sẽ khớp với trường hợp nào?', 'Các chuỗi bắt đầu bằng "Anh"', 'Các chuỗi kết thúc bằng "Anh"', 'Các chuỗi chứa "Anh" ở bất kỳ vị trí nào', 'Các chuỗi đúng chính xác là "Anh"', 'B', 'Pattern "%Anh" khớp với mọi chuỗi kết thúc bằng "Anh".'],
            ['DBI', 'Đáp án nào sau đây KHÔNG phải là kiểu dữ liệu date/time hợp lệ trong SQL?', 'DATE', 'TIME', 'TIMESTAMP', 'DATETEXT', 'D', 'SQL hỗ trợ DATE, TIME và TIMESTAMP cho date/time, nhưng không hỗ trợ DATETEXT.'],
            ['DBI', 'Kết quả của TRUE AND UNKNOWN trong SQL three-valued logic là gì?', 'TRUE', 'FALSE', 'UNKNOWN', 'NULL', 'C', 'Trong SQL three-valued logic, TRUE AND UNKNOWN cho kết quả là UNKNOWN.'],
            ['DBI', 'Clause nào được dùng để sắp xếp result set trong SQL?', 'GROUP BY', 'ORDER BY', 'SORT BY', 'ARRANGE BY', 'B', 'ORDER BY clause được dùng để sắp xếp result set theo thứ tự tăng hoặc giảm dần.'],
            ['DBI', 'Trong SQL, join nào trả về tất cả các bản ghi từ bảng bên trái và các bản ghi khớp từ bảng bên phải?', 'INNER JOIN', 'LEFT OUTER JOIN', 'RIGHT OUTER JOIN', 'FULL OUTER JOIN', 'B', 'LEFT OUTER JOIN trả về tất cả các hàng từ bảng bên trái và các hàng khớp từ bảng bên phải; các hàng không khớp sẽ chứa NULL.'],
            ['DBI', 'Hàm tổng hợp SQL COUNT() trả về điều gì?', 'Số lượng giá trị khác nhau trong một cột', 'Số lượng giá trị khác NULL trong một cột', 'Tổng số hàng trong một table, bao gồm cả NULL', 'Tổng giá trị trong một cột', 'C', 'COUNT() trả về tổng số hàng trong một table, bao gồm cả các hàng có giá trị NULL.'],
            ['DBI', 'Clause SQL nào được dùng để lọc các group sau khi aggregation?', 'WHERE', 'HAVING', 'GROUP BY', 'FILTER', 'B', 'HAVING clause được dùng để lọc các group dựa trên điều kiện aggregation, khác với WHERE là lọc các hàng.'],
            ['DBI', 'Transaction trong database là gì?', 'Một câu lệnh SQL đơn lẻ', 'Một nhóm các thao tác được thực hiện như một đơn vị duy nhất', 'Một bản sao lưu của database', 'Một phiên làm việc của người dùng', 'B', 'Transaction là một tập hợp một hoặc nhiều thao tác được thực thi như một đơn vị nguyên tử.'],
            ['DBI', 'Thuộc tính nào của transaction đảm bảo rằng tất cả các thao tác đều được hoàn thành hoặc không thao tác nào được thực hiện?', 'Consistency', 'Isolation', 'Atomicity', 'Durability', 'C', 'Atomicity đảm bảo rằng một transaction có tính tất cả-hoặc-không; hoặc tất cả thao tác thành công, hoặc không thao tác nào thành công.'],
            ['DBI', 'Isolation level nào cho phép dirty reads?', 'READ COMMITTED', 'READ UNCOMMITTED', 'REPEATABLE READ', 'SERIALIZABLE', 'B', 'Isolation level READ UNCOMMITTED cho phép đọc dữ liệu chưa được commit (dirty reads).'],
            ['DBI', 'Mục đích chính của một index trong database là gì?', 'Đảm bảo referential integrity', 'Tăng tốc các thao tác truy xuất dữ liệu', 'Lưu trữ dữ liệu backup', 'Định nghĩa mối quan hệ giữa các table', 'B', 'Index là các cấu trúc dữ liệu giúp cải thiện tốc độ truy xuất dữ liệu trên các table trong database.'],
            ['DBI', 'Loại index nào sắp xếp lại vật lý các hàng dữ liệu trong một table?', 'Non-clustered index', 'Clustered index', 'Unique index', 'Composite index', 'B', 'Clustered index sắp xếp lại cách lưu trữ vật lý của các hàng trong table để phù hợp với thứ tự của index.'],
            ['DBI', 'View trong SQL là gì?', 'Một bản sao vật lý của một table', 'Một table ảo được định nghĩa bởi một query', 'Một table tạm thời', 'Một bản sao lưu của một table', 'B', 'View là một table ảo có nội dung được định nghĩa bởi một query; nó không lưu trữ dữ liệu một cách vật lý.'],

            // === LAB (JAVA/C) - 20 Câu ===
            ['LAB', 'Vòng lặp chạy ít nhất 1 lần?', 'For', 'While', 'Do-While', 'Foreach', 'C', 'Do-While check điều kiện sau.'],
            ['LAB', 'Chỉ số mảng bắt đầu từ?', '1', '0', '-1', 'null', 'B', 'Index bắt đầu từ 0.'],
            ['LAB', 'Lệnh thoát vòng lặp?', 'Stop', 'Exit', 'Return', 'Break', 'D', 'Break thoát vòng lặp ngay lập tức.'],
            ['LAB', 'Kiểu chứa True/False?', 'Int', 'String', 'Boolean', 'Float', 'C', 'Boolean.'],
            ['LAB', 'Dấu "==" dùng để?', 'Gán', 'So sánh bằng', 'So sánh khác', 'Tăng', 'B', '== là so sánh bằng.'],
            ['LAB', 'Comment 1 dòng?', '//', '/* */', '#', '--', 'A', '// là comment 1 dòng trong C/Java.'],
            ['LAB', 'Toán tử AND logic?', '&', '&&', 'AND', '||', 'B', '&& là AND logic.'],
            ['LAB', 'Phép chia lấy dư?', '/', 'MOD', '%', 'DIV', 'C', '% là chia lấy dư.'],
            ['LAB', 'Toán tử khác nhau?', '=', '!=', '<>', '><', 'B', '!= là khác nhau.'],
            ['LAB', 'Kế thừa trong Java?', 'extends', 'implements', 'inherits', 'uses', 'A', 'class A extends B.'],
            ['LAB', 'Triển khai Interface?', 'extends', 'implements', 'interface', 'abstract', 'B', 'class A implements I.'],
            ['LAB', 'Hằng số trong Java?', 'const', 'final', 'static', 'var', 'B', 'Từ khóa final.'],
            ['LAB', 'In ra màn hình Java?', 'printf', 'cout', 'System.out.println', 'console.log', 'C', 'System.out.println().'],
            ['LAB', 'Hàm main trả về?', 'int', 'String', 'void', 'boolean', 'C', 'public static void main.'],
            ['LAB', 'Lỗi tràn mảng là?', 'NullPointer', 'IndexOutOfBounds', 'StackOverflow', 'ClassCast', 'B', 'ArrayIndexOutOfBoundsException.'],
            ['LAB', 'Lớp cha của mọi lớp?', 'Main', 'System', 'Object', 'Class', 'C', 'Object class.'],
            ['LAB', 'Access modifier kín nhất?', 'public', 'protected', 'default', 'private', 'D', 'Private chỉ nội bộ class thấy.'],
            ['LAB', 'Lấy độ dài chuỗi?', 'length', 'length()', 'size', 'size()', 'B', 'String.length().'],
            ['LAB', 'Vòng lặp biết trước số lần?', 'for', 'while', 'do-while', 'if', 'A', 'Vòng lặp for.'],
            ['LAB', 'Kiểu số nguyên lớn?', 'int', 'byte', 'long', 'short', 'C', 'Long (64 bit).'],

            // === SWEc (SOFTWARE ENGINEERING) - 20 Câu ===
            ['SWEc', 'SDLC là gì?', 'Software Design', 'System Design', 'Software Development Life Cycle', 'System Life', 'C', 'Vòng đời phát triển phần mềm.'],
            ['SWEc', 'Giai đoạn đầu SDLC?', 'Code', 'Test', 'Requirement', 'Deploy', 'C', 'Thu thập yêu cầu.'],
            ['SWEc', 'Mô hình thác nước?', 'Agile', 'Waterfall', 'Scrum', 'Spiral', 'B', 'Waterfall model.'],
            ['SWEc', 'Ai code chính?', 'Tester', 'Developer', 'BA', 'PM', 'B', 'Developer.'],
            ['SWEc', 'UML dùng để?', 'Code', 'Vẽ sơ đồ', 'Quản lý', 'Test', 'B', 'Unified Modeling Language.'],
            ['SWEc', 'Agile ưu tiên gì?', 'Công cụ', 'Quy trình', 'Phần mềm chạy được', 'Tài liệu', 'C', 'Working software over documentation.'],
            ['SWEc', 'Scrum Master là?', 'Sếp', 'Người hỗ trợ', 'Khách hàng', 'Lập trình viên', 'B', 'Servant Leader (Lãnh đạo phục vụ).'],
            ['SWEc', 'Unit Test ai làm?', 'Tester', 'Developer', 'User', 'PM', 'B', 'Dev viết Unit Test.'],
            ['SWEc', 'Test toàn hệ thống?', 'Unit Test', 'Integration Test', 'System Test', 'Acceptance Test', 'C', 'System Testing.'],
            ['SWEc', 'User Story mẫu?', 'As a... I want...', 'If... then...', 'When... then...', 'Given... when...', 'A', 'As a [role], I want [feature] so that [benefit].'],
            ['SWEc', 'Kanban tập trung?', 'Sprint', 'Trực quan hóa', 'Hợp đồng', 'Tài liệu', 'B', 'Visualize work (Bảng Kanban).'],
            ['SWEc', 'Black-box testing?', 'Hộp trắng', 'Hộp đen', 'Hiệu năng', 'Bảo mật', 'B', 'Kiểm thử không nhìn code.'],
            ['SWEc', 'SRS là tài liệu?', 'Code', 'Yêu cầu', 'Test', 'Thiết kế', 'B', 'Software Requirement Specification.'],
            ['SWEc', 'Sprint kéo dài?', '1-4 tuần', '3 tháng', '6 tháng', '1 năm', 'A', 'Thường là 2-4 tuần.'],
            ['SWEc', 'Báo cáo lỗi cần?', 'Tên', 'Ảnh', 'Các bước tái hiện', 'Tất cả', 'D', 'Càng chi tiết càng tốt.'],
            ['SWEc', 'Git là công cụ?', 'Code', 'Quản lý phiên bản', 'Test', 'Deploy', 'B', 'Version Control System.'],
            ['SWEc', 'CI/CD là gì?', 'Code', 'Tích hợp/Triển khai liên tục', 'Test', 'Database', 'B', 'Continuous Integration / Continuous Deployment.'],
            ['SWEc', 'Product Backlog chứa?', 'Code', 'Task đã xong', 'Danh sách tính năng', 'Bug', 'C', 'Danh sách mọi thứ cần làm cho sản phẩm.'],
            ['SWEc', 'Burndown chart đo?', 'Tiền', 'Tiến độ', 'Lỗi', 'Nhân sự', 'B', 'Đo lượng công việc còn lại theo thời gian.'],
            ['SWEc', 'TDD là gì?', 'Test Driven Development', 'Test Design Document', 'Technical Design Data', 'Top Down Design', 'A', 'Phát triển hướng kiểm thử.']
        ];

        await connection.query(sqlInsert, [values]);

        connection.release();
        res.send(`<h1> Đã nạp thành công lên Aiven!</h1>`);
    } catch (err) {
        console.error(err);
        res.status(500).send(`<h1>Lỗi: ${err.message}</h1>`);
    }
});

// --- API LẤY QUIZ ---
app.get('/api/quiz/:category', async (req, res) => {
    try {
        const category = req.params.category;
        const [rows] = await pool.query(
            'SELECT * FROM Questions WHERE category = ? ORDER BY RAND() LIMIT 20', 
            [category]
        );
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Lỗi kết nối Aiven' });
    }
});   

// --- API LƯU FEEDBACK ---
app.post('/feedback', async (req, res) => {
    try {
        const { name, email, phone, message } = req.body;

        if (!name || !email || !message) {
            return res.status(400).json({ 
                success: false, 
                message: "Name, email và message là bắt buộc!" 
            });
        }
    
        const sql = "INSERT INTO Feedback (name, email, phone, message) VALUES (?, ?, ?, ?)";
        await pool.query(sql, [name, email, phone || null, message]);

        console.log("Đã nhận feedback từ:", name);
        res.json({ 
            success: true, 
            message: "Cảm ơn bạn đã phản hồi!" 
        });
    } catch (error) {
        console.error("Lỗi lưu feedback:", error);
        res.status(500).json({ 
            success: false, 
            message: "Lỗi lưu phản hồi." 
        });
    }
});

app.use((req, res) => {
    res.status(404).json({ 
        error: 'Endpoint not found',
        availableEndpoints: {
            root: '/',
            health: '/health',
            initDB: '/init-db',
            quiz: '/api/quiz/:category',
            feedback: '/feedback'
        }
    });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        error: 'Internal Server Error',
        message: err.message 
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});
