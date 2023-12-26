import express from 'express';
import dotenv from 'dotenv';
import conn from './db.js';
//import HomeRoute from "./routes/HomeRoute.js";
import models from './models/index.js';
const Kullanici = models.Kullanici;
const Yetenekler =models.Yetenekler;
const Egitimler=models.Egitim;
const Deneyim=models.Deneyim;
const Portfolyo=models.Portfolyo;
const Link=models.Link;
const Mesaj=models.Mesaj;
const login=models.Login;
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { ObjectId } from 'mongodb';
import mongoose, { model } from 'mongoose';
import { Int32 } from "mongodb";
import { error } from 'console';
import Egitim from './models/Egitim.js';
import BoolOnay from './models/BoolOnay.js';
import Login from './models/login.js';
import cookieSession from 'cookie-session';



dotenv.config();

//connection tı the DB

conn();

const app = express();
const port = 3000;
//ejs tempalte engine

app.set('view engine', 'ejs');

//static files middleware
app.use(express.static('public'));
app.use(cookieSession({
  name: 'session',
  keys: ['your-secret-key'],
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));


app.get('/', async (req, res) => {
  try {
    // Tüm modellerden verileri tek bir sorguda çekme
    const [kullaniciResult, yeteneklerResult, egitimlerResult, deneyimResult, portfolyoResult, linkResult, boolOnayResult] = await Promise.all([
      models.Kullanici.find().sort({ createdAt: -1 }),
      models.Yetenekler.find().sort({ createdAt: -1 }),
      models.Egitim.find().sort({ createdAt: -1 }),
      models.Deneyim.find().sort({ createdAt: -1 }),
      models.Portfolyo.find().sort({ createdAt: -1 }),
      models.Link.find().sort({ createdAt: -1 }),
      models.BoolOnay.find().sort({ createdAt: -1 })
    ]);

    // Şablonu render etme
    res.render('Home/index', {
      Kullanici: kullaniciResult,
      Yetenekler: yeteneklerResult,
      Egitim: egitimlerResult,
      Deneyim: deneyimResult,
      Portfolyo: portfolyoResult,
      Link: linkResult,
      BoolOnay: boolOnayResult
    });
  } catch (err) {
    console.error("Veri çekme hatası:", err);
    res.render('Admin/yetenek', { Yetenekler: [] });
  }
});
// Home port sayfası
app.get('/portfolyo/:id', async (req,res)=>{ 
  const portid=req.params.id;
  try{
    const port=await models.Portfolyo.findById(portid)
    if(port){
      res.render('Home/port',{Portfolyo:port});
    }else{
      res.status(404).send('portfolyo bulunamadı')
    }
  }catch (error) {
  res.status(404).send('Nedeni bilinmeyen hata: ' + error.message);
}

  res.render('Home/port', { Portfolyo: [] });
  
});

//İndex sayfası Mesaj gönderme işlemi
app.use(express.urlencoded({ extended: true }));
app.post('/send', async (req, res) => {
  if(req.body==null){
    res.redirect('/');
  }
  const tarihString = Date.now(); // Date.now() fonksiyonunu çağırın
  const tarih = new Date(tarihString);

  const formatOptions = {
    day: 'numeric',
    month: 'long',
    weekday: 'long',
    hour: 'numeric',
    minute: 'numeric',
  };
  const formatliTarih = tarih.toLocaleDateString('tr-TR', formatOptions);
    try {
      const yeniMesaj = new Mesaj({
        Isim:req.body.Isim,
        Baslik:req.body.Baslik,
        Email:req.body.Email,
        Mesaj:req.body.Mesaj,
        Tarih:formatliTarih,
      });
      // Veritabanına Mesajı ekle ekle
      yeniMesaj.save()
      .then((result) => {
        console.log('Yeni Link eklendi:', result);
        
      })
      .catch((err) => {
        console.error('Veritabanına Mesaj eklerken hata oluştu:', err.message);
        console.error('Hata stack trace:', err.stack);

      });

    } catch (err) {
      console.error('Ekleme hatası:', err);
      res.status(500).send('Ekleme hatası');
    }

  res.redirect('/');
});

app.get('/login',(req,res)=>{
  res.render('Admin/login' , { error: '' });
});
app.use(express.urlencoded({ extended: true }));
app.post('/log', async (req, res) => {

  const Kadi = req.body.Kullaniciad;

  const pas=req.body.Password;
  try {
      // Kullanıcı adı ve şifreyi veritabanında kontrol et
      const user = await login.findOne({ Kullaniciad: Kadi, Password: pas });

      if (user) {
          // Oturumu başlat
          req.session.user = { Kullanicad: user.Kullanicadi };
          res.redirect('/adm');
      } else {
          // Giriş başarısızsa, hata mesajı göster
          res.render('Admin/login', { error: 'Geçersiz kullanıcı adı veya şifre' });
      }
  } catch (error) {
      console.error('Veritabanı hatası:', error);
      res.render('Admin/login', { error: 'Bir hata oluştu' });
  }
});
//giriş işlemleri
const sessionMiddleware = (req, res, next) => {
  if (!req.session.user && req.originalUrl !== '/login') {
      // Kullanıcı oturumu yoksa ve login sayfasında değilse, login sayfasına yönlendir
      res.redirect('/login');
  } else {
      next(); // Kullanıcı giriş yapmışsa veya login sayfasındaysa, devam et
  }
};

// Middleware'i tüm rotalarda kullan
app.use(sessionMiddleware);

app.get('/logout', (req, res) => {
  req.session = null;
  res.redirect('/');
});



//Admin sayfası listeleme
app.get('/adm', sessionMiddleware,(req,res)=>{
  models.Kullanici.find().sort({ createdAt: -1 })
  .then((result) => {
      res.render('Admin/admin', { Kullanicis: result });
  })
  .catch((err) => {
      console.error("Veri çekme hatası:", err);
      res.render('Admin/admin', { Kullanicis: [] });
  });
})

//yetenek sayfası listeleme
app.get('/yetenek', (req,res)=>{
  
  models.Yetenekler.find().sort({ createdAt: -1 })
  .then((result) => {
      res.render('Admin/yetenek', { Yeteneklers: result });
  })
  .catch((err) => {
      console.error("Veri çekme hatası:", err);
      res.render('Admin/yetenek', { Yetenekler: [] });
  });
})

//yetenek sayfası delete silme işlemi
app.post('/yetenekdelete/:id', async (req, res) => {
  const yetenekId = req.params.id;

  try {
    // MongoDB'de yetenekleri sil
    const result = await models.Yetenekler.deleteMany({_id:yetenekId});

    if (result) {
      console.log('Yetenek başarıyla silindi:', result);
      res.redirect('/yetenek'); // Silme işlemi başarılıysa, yetenek sayfasına yönlendir
    } else {
      console.log('Belirtilen ID ile eşleşen yetenek bulunamadı.');
      res.status(404).send('Yetenek bulunamadı.');
    }
  } catch (error) {
    console.error('Hata:', error);
    console.error()
    res.status(500).send('Bir hata oluştu.'+yetenekId);
  }
});

//yetenek sayfası guncelleme işlemi
app.get('/yu/:id', async (req, res) => {
  const yetenekId = req.params.id;  
  try {
    const yetenek = await models.Yetenekler.findById(yetenekId);
    if (yetenek) {
      res.render('Admin/yetup', { Yetenek: yetenek });
    } else {
      res.status(404).send('Yetenek bulunamadı.');
    }
  } catch (error) {
    res.status(404).send('Nedeni bilinmeyen hata: ' + error.message);
  }
});
app.use(express.urlencoded({ extended: true }));
//yetenekguncelle sayfası veri tabanı güncelleme işlemi
app.post('/yu',async(req,res)=>{
  var item = {
    YetenekAd: req.body.YetenekAd,
    YetenekDeger: req.body.YetenekDeger,
  };
  const id = req.body._id;

  try {
    const docId = new ObjectId(id);
    const result = await Yetenekler.updateOne(
      { _id: docId },
      { $set: item }
    );
    if (result.modifiedCount === 1) {
      console.log('Değer başarıyla güncellendi.');
    } else {
      console.log(req.body.YetenekDeger);
      console.log('Belirtilen ID ile eşleşen belge bulunamadı.' );
    }
  } catch (error) {
    console.error('Hata:', error);
  }

  res.redirect('/yetenek');
});

//Yetenek ekleme sayfası
app.get('/yetadd',(req,res)=>{
  res.render('Admin/yetadd');
})
app.use(express.urlencoded({ extended: true }));
app.post('/yetadd',async(req,res)=>{
  try {
    const yeniYetenek = new Yetenekler({
      YetenekAd:req.body.YetenekAd,
      YetenekDeger:req.body.YetenekDeger,
    });

    // Veritabanına kullanıcıyı ekle
    yeniYetenek.save()
      .then((result) => {
        console.log('Yeni kullanıcı eklendi:', result);
        
      })
      .catch((err) => {
        console.error('Veritabanına kullanıcı eklerken hata oluştu:', err.message);
        console.error('Hata stack trace:', err.stack);

      });

  } catch (err) {
    console.error('Ekleme hatası:', err);
    res.status(500).send('Ekleme hatası');
  }

  res.redirect('/yetenek');
});

//useradd sayfası kullanıcı güncelle veriler gönderildi

app.use(express.urlencoded({ extended: true }));

app.get('/user', (req,res)=>{
  models.Kullanici.find().sort({ createdAt: -1 })
  .then((result) => {
      res.render('Admin/useradd', { Kullanicis: result });
  })
  .catch((err) => {
      console.error("Veri çekme hatası:", err);
      res.render('Admin/useradd', { Kullanicis: [] });
  });
})
//post guncelleme işlemi

app.post('/useradd',async(req,res)=>{
  var item = {
    AdSoyad: req.body.AdSoyad,
    Unvan: req.body.Unvan,
    Yas: req.body.Yas,
    Email: req.body.Email,
    Telefon: req.body.Telefon,
    Adres: req.body.Adres,
    Hakkimda: req.body.Hakkimda,
    Language: req.body.Language,
  };
  const id = req.body._id;

  try {
    const docId = new ObjectId(id);

    const result = await Kullanici.updateOne(
      { _id: docId },
      { $set: item }
    );

    if (result.modifiedCount === 1) {
      console.log('Değer başarıyla güncellendi.');
    } else {
      console.log('Belirtilen ID ile eşleşen belge bulunamadı.');
    }
  } catch (error) {
    console.error('Hata:', error);
  }

  res.redirect('/user');
});




//dosya kaydetme işlemi cv
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/Home/cv/'); // Dosyanın kaydedileceği klasör
  },
  filename: function (req, file, cb) {
    // Dosya adının ne olacağı
    const dosyaAdi = 'cv';
    const uzanti = path.extname(file.originalname);
    const tamDosyaAdi = dosyaAdi + uzanti;

    // Eski CV dosyasını sil
    const eskiCvDosyaAdi="cv.pdf";
    fs.unlink('public/Home/cv/' + eskiCvDosyaAdi, (err) => {
      if (err && err.code !== 'ENOENT') {
        console.error('Eski CV dosyasını silerken hata oluştu:', err);
      }

      // Yeni CV dosyasını kaydet
      cb(null, tamDosyaAdi);
    });
  }
});

const upload = multer({ storage: storage });

app.post('/upload', upload.single('filename'), (req, res) => {
  // Dosya yüklendikten sonra burası çalışacak
  console.log('Dosya yüklendi:', req.file);
  setTimeout(() => {
    res.redirect('/user'); 
  }, 5000);
});

//upload image profil foto
const storage2 = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/Home/images/'); // Dosyanın kaydedileceği klasör
  },
  filename: function (req, file, cb) {
    // Dosya adının ne olacağı
    const dosyaAdi = 'bahadır';
    const uzanti = ".jpeg";
    const tamDosyaAdi = dosyaAdi + uzanti;

    // Eski image dosyasını sil
    const eskiad = "bahadır.jpeg";
    fs.unlink('public/Home/images/' + eskiad, (err) => {
      if (err && err.code !== 'ENOENT') {
        console.error('Eski resmi silerken hata oluştu:', err);
        // Hata durumunda da devam etmek istiyorsanız, bu hatayı cb'ye iletin.
        // cb(err);
      }

      // Yeni resim dosyasını kaydet
      cb(null, tamDosyaAdi);
    });
  }
});

const upload2 = multer({ storage: storage2 });

app.post('/uploadimage', upload2.single('filename'), (req, res) => {
  // Dosya yüklendikten sonra burası çalışacak
  console.log('Dosya yüklendi:', req.file);
  setTimeout(() => {
    res.redirect('/user');
  }, 5000);
});

//Eğitim sayfası listeleme
app.get('/egt', (req,res)=>{ 
  models.Egitim.find().sort({ createdAt: -1 })
  .then((result) => {
      res.render('Admin/egitim', { Egitimler: result });
  })
  .catch((err) => {
      console.error("Veri çekme hatası:", err);
      res.render('Admin/egitim', { Egitimler: [] });
  });
})
//Eğitim sayfayası add
app.get('/egadd',(req,res)=>{
  res.render('Admin/egadd');
})
app.use(express.urlencoded({ extended: true }));
app.post('/egadd',async(req,res)=>{
  try {
    var a='';
    if(req.body.BaslangicTime=='Null'){
      a=' ';  
    }
    else if(req.body.BitisTime=='Null'){
        a=req.body.BaslangicTime;
    }
    else{
        a=req.body.BaslangicTime+' - '+req.body.BitisTime;
    }
    const yeniEgitim = new Egitimler({
      OkulAd:req.body.OkulAd,
      Derece:req.body.Derece,
      Bolum:req.body.Bolum,
      Text:req.body.Text,
      Time:a,
    });
    // Veritabanına kullanıcıyı ekle
    yeniEgitim.save()
      .then((result) => {
        console.log('Yeni Eğitim eklendi:', result);
      })
      .catch((err) => {
        console.error('Veritabanına eğitim eklerken hata oluştu:', err.message);
        console.error('Hata stack trace:', err.stack);
      });

  } catch (err) {
    console.error('Ekleme hatası:', err);
    res.status(500).send('Ekleme hatası');
  }

  res.redirect('/egt');
});
// Eğitim sayfası delete
app.post('/egitimdelete/:id', async (req, res) => {
  const EgitimId = req.params.id;
  try {
    // MongoDB'de yetenekleri sil
    const result = await models.Egitim.deleteMany({_id:EgitimId});

    if (result) {
      console.log('Eğitim başarıyla silindi:', result);
      res.redirect('/egt'); // Silme işlemi başarılıysa, yetenek sayfasına yönlendir
    } else {
      console.log('Belirtilen ID ile eşleşen eğitim bulunamadı.');
      res.status(404).send('Eğitim bulunamadı.');
    }
  } catch (error) {
    console.error('Hata:', error);
    console.error()
    res.status(500).send('Bir hata oluştu.'+yetenekId);
  }
});

//Eğitim sayfası guncelleme işlemi
app.get('/egup/:id', async (req, res) => {
  const EgitimId = req.params.id;  
  try {
    const egitim = await models.Egitim.findById(EgitimId);
    if (egitim) {
      res.render('Admin/egup', { Egitimler: egitim });
    } else {
      res.status(404).send('Eğitim bulunamadı.');
    }
  } catch (error) {
    res.status(404).send('Nedeni bilinmeyen hata: ' + error.message);
  }
});
app.use(express.urlencoded({ extended: true }));

//Eğitim guncelle sayfası veri tabanı güncelleme işlemi
app.post('/egup',async(req,res)=>{
  var a='';
  if(req.body.BaslangicTime=='Null'){
    a=' ';  
  }
  else if(req.body.BitisTime=='Null'){
      a=req.body.BaslangicTime;
  }
  else{
      a=req.body.BaslangicTime+' - '+req.body.BitisTime;
  }
  var item = {
    OkulAd:req.body.OkulAd,
    Derece:req.body.Derece,
    Bolum:req.body.Bolum,
    Text:req.body.Text,
    Time:a,
  };
  const id = req.body._id;

  try {
    const docId = new ObjectId(id);
    const result = await Egitim.updateOne(
      { _id: docId },
      { $set: item }
    );
    if (result.modifiedCount === 1) {
      console.log('Değer başarıyla güncellendi.');
    } else {
      console.log('Belirtilen ID ile eşleşen belge bulunamadı.' );
    }
  } catch (error) {
    console.error('Hata:', error);
  }

  res.redirect('/egt');
});

//Deneyim sayfası
app.get('/den', (req,res)=>{ 
  models.Deneyim.find().sort({ createdAt: -1 })
  .then((result) => {
      res.render('Admin/deneyim', { Deneyim: result });
  })
  .catch((err) => {
      console.error("Veri çekme hatası:", err);
      res.render('Admin/deneyim', { Deneyim: [] });
  });
})
//Deneyim add sayfası
app.get('/denadd',(req,res)=>{
  res.render('Admin/denadd');
});
app.use(express.urlencoded({ extended: true }));
app.post('/denadd',async(req,res)=>{
  try {
    var a='';
    if(req.body.BaslangicTime=='Null'){
      a=' ';  
    }
    else if(req.body.BitisTime=='Null'){
        a=req.body.BaslangicTime;
    }
    else{
        a=req.body.BaslangicTime+' - '+req.body.BitisTime;
    }
    const yeniDeneyim = new Deneyim({
      Isletme:req.body.Isletme,
      Unvan:req.body.Unvan,
      Text:req.body.Text,
      Time:a,
    });
    // Veritabanına kullanıcıyı ekle
    yeniDeneyim.save()
      .then((result) => {
        console.log('Yeni Eğitim eklendi:', result);
      })
      .catch((err) => {
        console.error('Veritabanına veri eklerken hata oluştu:', err.message);
        console.error('Hata stack trace:', err.stack);
      });

  } catch (err) {
    console.error('Ekleme hatası:', err);
    res.status(500).send('Ekleme hatası');
  }

  res.redirect('/den');
});

//Deneyim delete
app.post('/deneyimdelete/:id', async (req, res) => {
  const deneyimId = req.params.id;

  try {
    // MongoDB'de Deneyimleri sil
    const result = await models.Deneyim.deleteMany({_id:deneyimId});

    if (result) {
      console.log('Deneyim başarıyla silindi:', result);
      res.redirect('/den'); // Silme işlemi başarılıysa, deneyim sayfasına yönlendir
    } else {
      console.log('Belirtilen ID ile eşleşen deneyim bulunamadı.');
      res.status(404).send('deneyim bulunamadı.');
    }
  } catch (error) {
    console.error('Hata:', error);
    console.error()
    res.status(500).send('Bir hata oluştu.'+yetenekId);
  }
});


//Deneyim update sayfası
app.get('/denup/:id', async (req, res) => {
  const DeneyimId = req.params.id;  
  try {
    const deneyim = await models.Deneyim.findById(DeneyimId);
    if (deneyim) {
      res.render('Admin/denup', { Deneyim:deneyim});
    } else {
      res.status(404).send('Deneyim bulunamadı.');
    }
  } catch (error) {
    res.status(404).send('Nedeni bilinmeyen hata: ' + error.message);
  }
});

app.use(express.urlencoded({ extended: true }));

//Deneyim guncelle sayfası veri tabanı güncelleme işlemi
app.post('/denup',async(req,res)=>{
  var a='';
  if(req.body.BaslangicTime=='Null'){
    a=' ';  
  }
  else if(req.body.BitisTime=='Null'){
      a=req.body.BaslangicTime;
  }
  else{
      a=req.body.BaslangicTime+' - '+req.body.BitisTime;
  }
  var item = {
    Isletme:req.body.Isletme,
    Unvan:req.body.Unvan,
    Text:req.body.Text,
    Time:a,
  };
  const id = req.body._id;

  try {
    const docId = new ObjectId(id);
    const result = await Deneyim.updateOne(
      { _id: docId },
      { $set: item }
    );
    if (result.modifiedCount === 1) {
      console.log('Değer başarıyla güncellendi.');
    } else {
      console.log('Belirtilen ID ile eşleşen belge bulunamadı.' );
    }
  } catch (error) {
    console.error('Hata:', error);
  }

  res.redirect('/den');
});



//////////////////////////////////////////////////////////////////
//portfolyo sayfası
app.get('/port', (req,res)=>{ 
  models.Portfolyo.find().sort({ createdAt: -1 })
  .then((result) => {
      res.render('Admin/port', { Portfolyo: result });
  })
  .catch((err) => {
      console.error("Veri çekme hatası:", err);
      res.render('Admin/port', { Portfolyo: [] });
  });
})
//Portfolyo resim 1
const storage3 = multer.diskStorage({
  destination: 'public/Portfolyo',
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '.jpg');
  }
});
const upload3 = multer({ storage: storage3 });

//portfolyo add sayfası
app.get('/portadd', (req,res)=>{ 
  res.render('Admin/portadd');
})
app.post('/portadd', upload3.single('Resim1'), (req, res) => {
  try {
    // Dosya yüklendiyse işlem yap
    if (req.file) {
      const resimDosyaAdi = "Portfolyo/"+req.file.filename;

      if (req.body.Blog == "false") {
        const yeniport = new Portfolyo({
          Baslik1: req.body.Baslik1,
          Resim1: resimDosyaAdi,
          Link: req.body.Link,
          Tur: req.body.Tur,
          Blog: false,
        });

        yeniport.save()
          .then((result) => {
            console.log('Yeni Portföy eklendi:', result);
          })
          .catch((err) => {
            console.error('Veritabanına Portföy eklerken hata oluştu:', err.message);
            console.error('Hata stack trace:', err.stack);
          });

      } else if (req.body.Blog == "true") {
        const baslik2 = req.body.Baslik2 || '';
        const text = req.body.Text || '';

        const yeniport2 = new Portfolyo({
          Baslik1: req.body.Baslik1,
          Resim1: resimDosyaAdi,
          Baslik2: baslik2,
          Text: text,
          Link: "",
          GitLink:req.body.GitLink,
          Tur: req.body.Tur,
          Blog: true,
        });

        yeniport2.save()
          .then((result) => {
            const link="portfolyo/"+result.id;
            result.Link=link;
            return result.save();
            console.log('Yeni Portföy eklendi:', result);
          })
          .catch((err) => {
            console.error('Veritabanına Portföy eklerken hata oluştu:', err.message);
            console.error('Hata stack trace:', err.stack);
          });
      }

      res.redirect('/port');
    } else {
      // Dosya yüklenmediyse hata mesajı gönder
      throw new Error('Dosya yüklenirken bir hata oluştu.');
    }

  } catch (err) {
    console.error('Ekleme hatası:', err);
    res.status(500).send('Ekleme hatası: ' + err.message);
  }
});
app.use(express.urlencoded({ extended: true }));
app.post('/portdelete/:id', async (req, res) => {
  const PortId = req.params.id;
  const Port = await models.Portfolyo.findById(PortId);
  const imageLink = Port.Resim1;
  
  
  try {
    const result = await models.Portfolyo.deleteMany({ _id: PortId });
    if(imageLink){
      fs.unlink('public/'+imageLink, err=>{
        if(err){
          console.log(err);
        }
      });
    }

    if (result.deletedCount > 0) {
      console.log('Portfolyo başarıyla silindi:', result,imageLink);
      return res.redirect('/port'); // return anahtar kelimesi ile işlemi sonlandırın
    } else {
      console.log('Belirtilen ID ile eşleşen Portfolyo bulunamadı.');
      return res.status(404).send('Link bulunamadı.'); // return anahtar kelimesi ile işlemi sonlandırın
    }
  } catch (error) {
    console.error('Hata:', error);
    return res.status(500).send('Bir hata oluştu.');
  }
});
// portfolyo update sayfası
app.get('/portup/:id', async (req, res) => {
  const PortId = req.params.id;  
  try {
    const Port = await models.Portfolyo.findById(PortId);
    if (Port) {
      res.render('Admin/portup', { Port: Port });
    } else {
      res.status(404).send('Link bulunamadı.');
    }
  } catch (error) {
    res.status(404).send('Nedeni bilinmeyen hata: ' + error.message);
  }
});
//Portfolyo güncelleme işlemi
app.use(express.urlencoded({ extended: true }));
app.post('/portup',upload3.single('Resim1'), async(req,res)=>{
  const id = req.body._id;
  const portfolyo=await models.Portfolyo.findById(id);
  let newImage =null;
  const link=portfolyo.Resim1;
  if(req.file){
    newImage =req.file.filename;
    if(link){
      try{
        fs.unlink('public/'+link, err=>{
          if(err){
            console.log(err);
          }
        });
      }catch(err){
        console.error('eski resim silinirken hata oldu', error);
      }
    }
    newImage='/Portfolyo/'+newImage;
  }else{
    newImage=link;
  }

  if(portfolyo.Blog){
    var item = {
      Baslik1:req.body.Baslik1,
      Baslik2:req.body.Baslik2,
      Tur:req.body.Tur,
      Text:req.body.Text,
      GitLink:req.body.GitLink,
      Resim1:newImage,
    };
  }else{
    var item = {
      Baslik1:req.body.Baslik1,
      Tur:req.body.Tur,
      Link:req.body.Link,
      GitLink:req.body.GitLink,
      Resim1:newImage, 
    };
  }
  try {
    const docId = new ObjectId(id);
    const result = await Portfolyo.updateOne(
      { _id: docId },
      { $set: item }
    );
    if (result.modifiedCount === 1) {
      console.log('Değer başarıyla güncellendi.');
    } else {
      console.log(req.body.LinkId);
      console.log('Belirtilen ID ile eşleşen belge bulunamadı.' );
    }
  } catch (error) {
    console.error('Hata:', error);
    res.redirect('/port');
  }

  res.redirect('/port');
});







//////////////////////////////////////////////////////////////////

// link sayfası
app.get('/link', (req,res)=>{ 
  models.Link.find().sort({ createdAt: -1 })
  .then((result) => {
      res.render('Admin/link', { Link: result });
  })
  .catch((err) => {
      console.error("Veri çekme hatası:", err);
      res.render('Admin/link', { Link: [] });
  });
})

//link update sayfası
app.get('/linkup/:id', async (req, res) => {
  const LinkId = req.params.id;  
  try {
    const Link = await models.Link.findById(LinkId);
    if (Link) {
      res.render('Admin/linkup', { Link: Link });
    } else {
      res.status(404).send('Link bulunamadı.');
    }
  } catch (error) {
    res.status(404).send('Nedeni bilinmeyen hata: ' + error.message);
  }
});
app.use(express.urlencoded({ extended: true }));
app.post('/linkup',async(req,res)=>{
  var item = {
    LinkAd: req.body.LinkAd,
    link: req.body.link,
    linkIcon: req.body.linkIcon,
  };
  const id = req.body._id;

  try {
    const docId = new ObjectId(id);
    const result = await Link.updateOne(
      { _id: docId },
      { $set: item }
    );
    if (result.modifiedCount === 1) {
      console.log('Değer başarıyla güncellendi.');
    } else {
      console.log(req.body.LinkId);
      console.log('Belirtilen ID ile eşleşen belge bulunamadı.' );
    }
  } catch (error) {
    console.error('Hata:', error);
  }

  res.redirect('/link');
});
//Link sayfası delete silme işlemi
app.post('/linkdelete/:id', async (req, res) => {
  const LinkId = req.params.id;

  try {
    // MongoDB'de yetenekleri sil
    const result = await models.Link.deleteMany({_id:LinkId});

    if (result) {
      console.log('Link başarıyla silindi:', result);
      res.redirect('/link'); // Silme işlemi başarılıysa, yetenek sayfasına yönlendir
    } else {
      console.log('Belirtilen ID ile eşleşen link bulunamadı.');
      res.status(404).send('link bulunamadı.');
    }
  } catch (error) {
    console.error('Hata:', error);
    console.error()
    res.status(500).send('Bir hata oluştu.'+LinkId);
  }
});
// Link add işlemi
//Link ekleme sayfası
app.get('/linkadd',(req,res)=>{
  res.render('Admin/linkadd');
})
app.use(express.urlencoded({ extended: true }));
app.post('/linkadd',async(req,res)=>{
  try {
    const yeniLink = new Link({
      LinkAd:req.body.LinkAd,
      link:req.body.link,
      linkIcon:req.body.linkIcon,
    });


    // Veritabanına kullanıcıyı ekle
    yeniLink.save()
      .then((result) => {
        console.log('Yeni Link eklendi:', result);
        
      })
      .catch((err) => {
        console.error('Veritabanına link eklerken hata oluştu:', err.message);
        console.error('Hata stack trace:', err.stack);

      });

  } catch (err) {
    console.error('Ekleme hatası:', err);
    res.status(500).send('Ekleme hatası');
  }

  res.redirect('/link');
});

// Web ayarları boolOnay sayfası
app.get('/web', (req,res)=>{ 
  models.BoolOnay.find().sort({ createdAt: -1 })
  .then((result) => {
      res.render('Admin/web', { BoolOnay: result });
  })
  .catch((err) => {
      console.error("Veri çekme hatası:", err);
      res.render('Admin/web', { BoolOnay: [] });
  });
})

// Web ayarları boolOnay sayfası güncelleme
app.use(express.urlencoded({ extended: true }));
app.post('/webup/:id',async(req,res)=>{
  const id = req.params.id; 
  const formVerileri = req.body;
  var item = {
    Hakkimda:formVerileri.Hakkimda === 'on',
    Yetenekler:formVerileri.Yetenekler === 'on',
    Deneyim:formVerileri.Deneyim === 'on',
    Portfolyo:formVerileri.Portfolyo === 'on',
    Egitim:formVerileri.Egitim === 'on',
    Yas:formVerileri.Yas === 'on',
    Email:formVerileri.Email === 'on',
    Telefon:formVerileri.Telefon === 'on',
    Adres:formVerileri.Adres === 'on',
    Language:formVerileri.Language === 'on',
  };
  try {
    const docId = new ObjectId(id);
    const result = await BoolOnay.updateOne(
      { _id: docId },
      { $set: item }
    );
    if (result.modifiedCount === 1) {
      console.log('Değer başarıyla güncellendi.');
    } else {
      console.log(req.body.LinkId);
      console.log('Belirtilen ID ile eşleşen belge bulunamadı.' );
    }
  } catch (error) {
    console.error('Hata:', error);
  }

  res.redirect('/web');
});







//mesajlar sayfası 
app.get('/msj', (req,res)=>{ 
  models.Mesaj.find().sort({ createdAt: -1 })
  .then((result) => {
      res.render('Admin/message', { Mesaj: result });
  })
  .catch((err) => {
      console.error("Veri çekme hatası:", err);
      res.render('Admin/message', { Mesaj: [] });
  });
})
//mesaj silme
app.post('/mesajdelete/:id', async (req, res) => {
  const id = req.params.id;

  try {
    // MongoDB'de yetenekleri sil
    const result = await models.Mesaj.deleteMany({_id:id});

    if (result) {
      console.log('Mesaj başarıyla silindi:', result);
      res.redirect('/msj'); // Silme işlemi başarılıysa, yetenek sayfasına yönlendir
    } else {
      console.log('Belirtilen ID ile eşleşen mesaj bulunamadı.');
      res.status(404).send('Mesaj bulunamadı.');
    }
  } catch (error) {
    console.error('Hata:', error);
    console.error()
    res.status(500).send('Bir hata oluştu.'+id);
  }
});

app.listen(process.env.PORT||port, () => {
  console.log(`Uygulama ${port} portunda çalışıyor`);
});
