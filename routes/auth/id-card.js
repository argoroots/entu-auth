var _      = require('underscore')
var async  = require('async')
var op     = require('object-path')
var router = require('express').Router()
var soap   = require('soap')

var entu   = require('../../helpers/entu')



router.get('/', function(req, res) {
    res.redirect('https://id.auth.entu.ee/auth/id-card/callback')
})



router.get('/callback', function(req, res, next) {
    async.waterfall([
        function (callback) {
            if (req.headers.ssl_client_verify === 'SUCCESS' && req.headers.ssl_client_cert) {
                callback(null)
            } else {
                callback(new Error('ID-Card reading error'))
            }
        },
        function (callback) {
            soap.createClient('https://digidocservice.sk.ee/?wsdl', {}, callback)
        },
        function (client, callback) {
            client.CheckCertificate({ Certificate: req.headers.ssl_client_cert }, function(err, result) {
                if(err) { return callback(err) }

                callback(null, result)
            })
        },
        function (result, callback) {
            if(op.get(result, ['Status', '$value']) !== 'GOOD') { return callback(new Error('Not valid ID-Card')) }
            if(!op.get(result, ['UserIDCode', '$value'])) { return callback(new Error('Not ID code')) }

            var user = {}
            var name = _.compact([
                op.get(result, ['UserGivenname', '$value']),
                op.get(result, ['UserSurname', '$value'])
            ]).join(' ')

            op.set(user, 'provider', 'id-card')
            op.set(user, 'id', op.get(result, ['UserIDCode', '$value']))
            op.set(user, 'name', name)
            op.set(user, 'email', op.get(result, ['UserIDCode', '$value']) + '@eesti.ee')

            entu.sessionStart({ request: req, response: res, user: user }, callback)
        }
    ], function (err, session) {
        if(err) { return next(err) }

        var redirectUrl = req.cookies.redirect
        if(redirectUrl) {
            res.cookie('session', session.key, {
                maxAge: 14 * 24 * 60 * 60 * 1000,
                domain: APP_COOKIE_DOMAIN
            })
            res.clearCookie('redirect')
            res.redirect(redirectUrl)
        } else {
            res.send({
                result: session,
                version: APP_VERSION,
                started: APP_STARTED
            })
        }
    })
})



module.exports = router
