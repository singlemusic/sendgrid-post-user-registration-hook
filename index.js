const rp = require('request-promise');

/**
@param {object} user - The user being created
@param {string} user.id - user id
@param {string} user.tenant - Auth0 tenant name
@param {string} user.username - user name
@param {string} user.email - email
@param {boolean} user.emailVerified - is e-mail verified?
@param {string} user.phoneNumber - phone number
@param {boolean} user.phoneNumberVerified - is phone number verified?
@param {object} user.user_metadata - user metadata
@param {object} user.app_metadata - application metadata
@param {object} context - Auth0 connection and other context info
@param {string} context.requestLanguage - language of the client agent
@param {object} context.connection - information about the Auth0 connection
@param {object} context.connection.id - connection id
@param {object} context.connection.name - connection name
@param {object} context.connection.tenant - connection tenant
@param {object} context.webtask - webtask context
@param {function} cb - function (error, response)
*/
module.exports = function (user, context, cb) {
  const apiKey = context.webtask.secrets['sendgrid-api-key'];
  const connectionName = context.webtask.secrets['connection-name'];
  if (context.connection.name !== connectionName) {
    return cb();
  }
  rp.get({
    uri: 'https://api.sendgrid.com/v3/contactdb/lists',
    auth: {
      'bearer': apiKey
    },
    json: true
  })
    .then(listResponse => {
      console.log(listResponse);
      const listName = context.webtask.secrets['list-name'];
      const list = listForName(listResponse.lists, listName);
      if (!list) {
        return Promise.reject(new Error('No list named ' + listName));
      }
      return rp.post({
        uri: 'https://api.sendgrid.com/v3/contactdb/recipients',
        auth: {
          'bearer': apiKey
        },
        body: [
          {
            email: user.email
          }
        ],
        json: true
      })
        .then(response => {
          if (!response || !response.persisted_recipients || response.persisted_recipients.length === 0) {
            return Promise.reject(new Error('No persisted recipients'));
          }
          const recipientId = response.persisted_recipients[0];
          console.log('RECIPIENT ID:', recipientId);
          return rp.post({
            uri: 'https://api.sendgrid.com/v3/contactdb/lists/' + list.id + '/recipients/' + recipientId,
            auth: {
              'bearer': apiKey
            },
            json: true
          })
            .then(() => {
              console.log('Added ' + recipientId + ' to the ' + listName + ' list')
            })
            .catch(error => {
              console.error(error);
              cb(error);
            });
        })
        .catch(error => {
          console.error(error);
          cb(error);
        });
    })
    .catch(error => {
      console.error(error);
      cb(error);
    })
  cb();
};

function listForName(lists, name) {
  return lists.find(list => {
    return list.name === name;
  });
}
