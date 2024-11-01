# Install package and setup MongoDB database
## Install package
Type `npm i` to install all packages in `package.json`

Type `npm i mongodb`, `npm i mongoose nodemon`, add script: `"dev": "nodemon server.js"`
## Setup MongoDB Database
You can setup yourself. I do not write the instruction config database.
# MongoDB Schemas
```js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const replySchema = new Schema({
  text: String,
  created_on: Date,
  reported: { type: Boolean, default: false },
  delete_password: String
});
const Reply = mongoose.model('Reply', replySchema);

const threadSchema = new Schema({
  board: String,
  text: String,
  created_on: Date,
  bumped_on: Date,
  reported: { type: Boolean, default: false },
  delete_password: String,
  replies: [replySchema]
});

const Thread = mongoose.model('Thread', threadSchema);

module.exports = { Reply, Thread };
```
# Tests
## Creating a new thread
```js
test("Create new thread", (done) => {
  chai.request(server)
    .post(`/api/threads/${testBoardId}`)
    .send({ text: 'test thread', delete_password: 'password', replies: [testReply] })
    .end((err, res) => {
      assert.equal(res.status, 200);
      testThread = res.body;
      done();
    });
})
```
## Viewing the 10 most recent threads with 3 replies each
```js
test("Viewing the 10 most recent threads with 3 replies each", (done) => {
  chai.request(server)
    .get(`/api/threads/${testBoardId}`)
    .end((err, res) => {
      assert.equal(res.status, 200);
      done();
    });
});
```
## Reporting a thread
```js
test("Reporting a thread", (done) => {
  chai.request(server)
    .put(`/api/threads/${testBoardId}`)
    .send({ thread_id: testThread })
    .end((err, res) => {
      assert.equal(res.text, 'reported');
      done();
    });
});
```
## Creating a new reply
```js
test("Creating a new reply", (done) => {
  chai.request(server)
    .post('/api/replies/testBoardId')
    .send({ thread_id: testThread, text: 'test reply', delete_password: 'password' })
    .end((err, res) => {
      assert.equal(res.status, 200);
      done();
    });
});
```
## Viewing a single thread with all replies
```js
test("Viewing a single thread with all replies", (done) => {
  chai.request(server)
    .get(`/api/replies/${testBoardId}`)
    .query({ thread_id: testThread._id })
    .end((err, res) => {
      if (err) console.log(err);
      assert.equal(res.status, 200);
      done();
    });
});
```
## Reporting a reply
```js
test("Reporting a reply", (done) => {
  chai.request(server)
    .put(`/api/replies/${testBoardId}`)
    .send({ thread_id: testThread._id, reply_id: testThread.replies[0] })
    .end((err, res) => {
      assert.equal(res.text, 'reported')
      done();
    });

});
```
## Deleting a reply with the incorrect password
```js
test("Deleting a reply with the incorrect password", (done) => {
  chai.request(server)
    .delete(`/api/replies/${testBoardId}`)
    .send({ thread_id: testThread._id, reply_id: testThread.replies[0]._id, delete_password: 'wrongPassword' })
    .end((err, res) => {
      assert.equal(res.text, 'incorrect password')
      done();
    });
});
```
## Deleting a reply with the correct password
```js
test("Deleting a reply with the correct password", (done) => {
  chai.request(server)
    .delete(`/api/replies/${testBoardId}`)
    .send({ thread_id: testThread._id, reply_id: testThread.replies[0]._id, delete_password: 'password' })
    .end((err, res) => {
      assert.equal(res.text, 'success')
      done();
    });
});
```
## Deleting a thread with the incorrect password
```js
test('Deleting a thread with the incorrect password', (done) => {
  chai.request(server)
    .delete(`/api/threads/${testBoardId}`)
    .send({ thread_id: testThread._id, delete_password: 'wrongPassword' })
    .end((err, res) => {
        assert.equal(res.text, 'incorrect password');
        done()
    });
});
```
## Deleting a thread with the correct password
```js
test('Deleting a thread with the correct password', (done) => {
  chai.request(server)
    .delete(`/api/threads/${testBoardId}`)
    .send({ thread_id: testThread._id, delete_password: 'password' })
    .end((err, res) => {
        assert.equal(res.text, 'success');
        done()
    });
});
```
## Full source code
```js
const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {

  let testBoardId = 'testBoard';
  let testThread = null;
  let testReply = {
    text: 'test-reply',
    delete_password: 'password'
  }

  test("Create new thread", (done) => {
    chai.request(server)
      .post(`/api/threads/${testBoardId}`)
      .send({ text: 'test thread', delete_password: 'password', replies: [testReply] })
      .end((err, res) => {
        assert.equal(res.status, 200);
        testThread = res.body;
        done();
      });
  })

  test("Viewing the 10 most recent threads with 3 replies each", (done) => {
    chai.request(server)
      .get(`/api/threads/${testBoardId}`)
      .end((err, res) => {
        assert.equal(res.status, 200);
        done();
      });
  });

  test("Reporting a thread", (done) => {
    chai.request(server)
      .put(`/api/threads/${testBoardId}`)
      .send({ thread_id: testThread })
      .end((err, res) => {
        assert.equal(res.text, 'reported');
        done();
      });
  });

  test("Creating a new reply", (done) => {
    chai.request(server)
      .post('/api/replies/testBoardId')
      .send({ thread_id: testThread, text: 'test reply', delete_password: 'password' })
      .end((err, res) => {
        assert.equal(res.status, 200);
        done();
      });
  });

  test("Viewing a single thread with all replies", (done) => {
    chai.request(server)
      .get(`/api/replies/${testBoardId}`)
      .query({ thread_id: testThread._id })
      .end((err, res) => {
        if (err) console.log(err);
        assert.equal(res.status, 200);
        done();
      });
  });

  test("Reporting a reply", (done) => {
    chai.request(server)
      .put(`/api/replies/${testBoardId}`)
      .send({ thread_id: testThread._id, reply_id: testThread.replies[0] })
      .end((err, res) => {
        assert.equal(res.text, 'reported')
        done();
      });

  });


  test("Deleting a reply with the incorrect password", (done) => {
    chai.request(server)
      .delete(`/api/replies/${testBoardId}`)
      .send({ thread_id: testThread._id, reply_id: testThread.replies[0]._id, delete_password: 'wrongPassword' })
      .end((err, res) => {
        assert.equal(res.text, 'incorrect password')
        done();
      });
  });

  test("Deleting a reply with the correct password", (done) => {
    chai.request(server)
      .delete(`/api/replies/${testBoardId}`)
      .send({ thread_id: testThread._id, reply_id: testThread.replies[0]._id, delete_password: 'password' })
      .end((err, res) => {
        assert.equal(res.text, 'success')
        done();
      });
  });

  test('Deleting a thread with the incorrect password', (done) => {
    chai.request(server)
      .delete(`/api/threads/${testBoardId}`)
      .send({ thread_id: testThread._id, delete_password: 'wrongPassword' })
      .end((err, res) => {
          assert.equal(res.text, 'incorrect password');
          done()
      });
  });

  test('Deleting a thread with the correct password', (done) => {
    chai.request(server)
      .delete(`/api/threads/${testBoardId}`)
      .send({ thread_id: testThread._id, delete_password: 'password' })
      .end((err, res) => {
          assert.equal(res.text, 'success');
          done()
      });
  });
  
});

```
