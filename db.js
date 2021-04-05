const Sequelize = require('sequelize');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { STRING } = Sequelize;
const config = {
  logging: false
};

if(process.env.LOGGING){
  delete config.logging;
}
const conn = new Sequelize(process.env.DATABASE_URL || 'postgres://localhost/acme_db', config);

const User = conn.define('user', {
  username: STRING,
  password: STRING
});

User.byToken = async(token)=> {
  try {
    const payload = jwt.verify(token, process.env.secret);
    const id = payload.userId;
    const user = await User.findByPk(id);
    if(user){
      return user;
    }
    const error = Error('bad credentials');
    error.status = 401;;
    throw error;
  }
  catch(ex){
    const error = Error('bad credentials');
    error.status = 401;;
    throw error;
  }
};

User.authenticate = async({ username, password })=> {

  const user = await User.findOne({
    where: {
      username
    }
  });
  if(user) {
    const authenticated = bcrypt.compare(password, user.password);
    if(authenticated) {
      const userToken = jwt.sign({ userId: user.id }, process.env.secret );
      console.log('userToken>>>', userToken);
      return userToken;
    }
  }

  const error = Error('bad credentials');
  error.status = 401;
  throw error;
};

User.beforeCreate( async (credential) => {
  credential.password = await bcrypt.hash(credential.password, 10)
  });

const syncAndSeed = async()=> {
  await conn.sync({ force: true });
  const credentials = [
    { username: 'lucy', password: 'lucy_pw'},
    { username: 'moe', password: 'moe_pw'},
    { username: 'larry', password: 'larry_pw'}
  ];
  const [lucy, moe, larry] = await Promise.all(
    credentials.map( credential => User.create(credential))
  )
  return {
    users: {
      lucy,
      moe,
      larry
    }
  };
};

module.exports = {
  syncAndSeed,
  models: {
    User
  }
};