
/**
 * Module dependencies.
 */

var express = require('express')
var app = express()
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path')
  , bodyPaser = require('body-parser')
  , mysql = require('mysql')
  , session = require('express-session')
  , MySQLStore = require('express-mysql-session')(session);

var dbconfig = {
  hostname: "localhost",
  user: "root",
  password: "1234",
  database: "server2"
};

var client = mysql.createConnection(dbconfig);

client.connect(function (err) {
  console.log('MysqlConnection');
  if (err) {
    console.log(err);
    throw err;
  }
});

var sessionStore = new MySQLStore(dbconfig);

app.use(session({
  key: 'sid',
  secret: 'secret',
  resave: false,
  store: sessionStore,
  saveUninitialized: true
}));
// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}
app.get('/logout', function (req, res) {
  delete req.session.sessionId;
  res.redirect("/");
});
app.get('/', function (req, res) {
  if (req.session.sessionId) {
    res.redirect('/main');
  } else {
    res.render('login');
  }
});
app.get('/login', function (req, res) {
  if (req.session.sessionId) {
    res.redirect('/main');
  } else {
    res.render('login');
  }
});
app.get('/signup', function (req, res) {
  if (req.session.sessionId) {
    res.redirect('/');
  } else {
    res.render('signup');
  }
});
app.post('/signupcheck', function (req, res) {
  var nid = req.body.newid;
  var nnn = req.body.newnickname;
  var nem = req.body.newemail;
  var npw = req.body.newpw;
  var nn = req.body.newname;
  var npn = req.body.newpn;
  var nbd = req.body.newbd;
  client.query(`INSERT INTO user (user_id, user_nickname, user_email, user_pw, user_name, user_pn, user_bd) VALUES (?, ?, ?, ?, ?, ?, ?)`, [nid, nnn, nem, npw, nn, npn, nbd], function (err, result) {
    if (err) {
      console.log('err', err);
    }
  });
  res.send('<script> alert("' + nnn + '님 환영합니다."); location.href="/";</script>');
});

app.get('/main', function (req, res) {
  if (!req.session.sessionId) {
    res.redirect('/');
  } else {
    client.query('SELECT * FROM week', function (err, week) {
      if (err) {
        console.log('err', err);
      }
      res.render('./main', {
        id: req.session.sessionId,
        week: week
      });

    });
  }
});
app.get('/:pageId', function (req, res) {
  if (!req.session.sessionId) {
    res.redirect('/');
  } else {
    client.query('SELECT * FROM week', function (err1, week) {
      if (err1) {
        console.log('err', err1);
      }
      client.query('SELECT count(*) cnt FROM board WHERE category=?', [req.params.pageId], function(err2,cnt){
        if (err2) {
          console.log('err', err2);
        }
        client.query('SELECT id, category, writer, title, content, viewcount, date_format(board.wdate, "%Y-%m-%d") as wdate FROM board WHERE category=? order by id desc limit ?, 10 ',[req.params.pageId, 10*(cnt.length-1)], function(err3,rows){
          if (err3) {
            console.log('err', err3);
          }
          res.render(`./${req.params.pageId}`, {
            cnt: cnt,     //category가 pageId인 board db의 개수
            id: req.session.sessionId,
            week: week,   //week에는 id와 'mon', 등이 들어있다.
            rows: rows,    //rows에는 board에서 글 받아오기.
            pageId: req.params.pageId
          });
        });
      });
 
//      cline.query('SELECT * FROM board WHERE id=?')

    });
  }
});
app.get('/write', function(req,res){
  if (!req.session.sessionId) {
    res.redirect('/');
  } else {
    client.query('SELECT * FROM week', function (err, week) {
      if (err) {
        console.log('err', err0);
      }
          res.render('write', {
            id: req.session.sessionId,
            week: week,   //week에는 id와 'mon', 등이 들어있다.
            pageId: req.body.pageId

      });
 
//      cline.query('SELECT * FROM board WHERE id=?')

    });
  }
});
app.post('/logincheck', function (req, res) {
  var cid = req.body.id;
  var cpw = req.body.pw;
  client.query(`SELECT count(*) cnt FROM user WHERE user_id=? and user_pw=?`, [cid, cpw], function (err, rows) {
    var cnt = rows[0].cnt;
    if (err) {
      console.log('err', err);
    }

    if (cnt === 1) {
      req.session.sessionId = cid;
      res.redirect('/');
    } else {
      res.send('<script> alert("비밀번호나 아이디를 확인해주세요."); location.href="./login";</script>');
    }
  });
});
app.get('/write',function(req,res){
  res.render
});
app.get('/users', user.list);

http.createServer(app).listen(app.get('port'), function () {
  console.log('Express server listening on port ' + app.get('port'));
});
