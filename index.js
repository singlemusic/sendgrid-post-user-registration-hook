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
  const listId = context.webtask.secrets['list-id'];
  if (context.connection.name !== connectionName) {
    return cb();
  }
  const contactRequest = {
    list_ids: [
      listId
    ],
    contacts: [
      {
        email: user.email
      }
    ],
  };
  console.log('request: ', contactRequest);
  rp({
    method: 'PUT',
    uri: 'https://api.sendgrid.com/v3/marketing/contacts',
    auth: {
      'bearer': apiKey
    },
    body: contactRequest,
    json: true
  }).then(response => {
    console.log(response);
    return cb();
  }).catch(error => {
    console.error(error);
    return cb(error);
  });
};