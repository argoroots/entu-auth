var router   = require('express').Router()
var passport = require('passport')
var saml     = require('passport-saml').Strategy
var op       = require('object-path')
var fs       = require('fs')



passport.use(new saml({
        entryPoint: TAAT_ENTRYPOINT,
        issuer: TAAT_ISSUER,
        cert: fs.readFileSync(TAAT_CERT, 'utf-8'),
        privateCert: fs.readFileSync(TAAT_PRIVATECERT, 'utf-8')
    },
    function(profile, done) {
        process.nextTick(function () {
            return done(null, profile)
        })
    }
))



router.get('/', function(req, res, next) {
    if(req.query.next) {
        params.response.cookie('auth_redirect', req.query.next, {
            maxAge: 60 * 60 * 1000,
            domain: APP_COOKIE_DOMAIN
        })
    }

    res.redirect('/taat/auth')
})



router.get('/auth', passport.authenticate('saml', { scope: [], session: false }), function(req, res, next) {

})



router.post('/', passport.authenticate('saml', { failureRedirect: '/login', session: false }), function(req, res, next) {
    var user = {}
    op.set(user, 'provider', 'taat@' + op.get(req, ['user', 'schacHomeOrganization']))
    op.set(user, 'id', op.get(req, ['user', 'urn:mace:dir:attribute-def:eduPersonTargetedID']))
    op.set(user, 'name', op.get(req, ['user', 'urn:mace:dir:attribute-def:cn']))
    op.set(user, 'email', op.get(req, ['user', 'urn:mace:dir:attribute-def:mail']))

    entu.session_start({
        request: req,
        response: res,
        user: user
    }, function(err, data) {
        if(err) return next(err)

        if(req.cookies.auth_redirect) {
            res.redirect(req.cookies.auth_redirect)
        } else {
            res.send({
                result: data,
                version: APP_VERSION,
                started: APP_STARTED
            })
        }
    })
})



module.exports = router
