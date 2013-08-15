define(['js/core/Component', 'srv/auth/AuthorizationProvider', 'flow', "js/core/Error"], function (Component, AuthorisationProvider, flow, Error) {

    return Component.inherit('srv.core.AuthorizationService', {

        ctor: function () {
            this.$providers = [];
            this.callBase();
        },

        addChild: function (child) {
            if (child instanceof AuthorisationProvider) {
                this.$providers.push(child);
            } else {
                throw new Error("Child for Authorization Service must be an AuthorizationProvider");
            }

            this.callBase();
        },

        stop: function (callback) {
            flow()
                .seqEach(this.$providers, function (provider, cb) {
                    // ignore errors during stop
                    provider.stop(function () {
                        cb();
                    });
                })
                .exec(callback);
        },

        start: function (server, callback) {

            flow()
                .seqEach(this.$providers, function (provider, cb) {
                    provider.start(server, cb);
                })
                .exec(callback);

        },

        isAuthorized: function (context, authorizationRequest, callback) {
            var authorized = false;
            flow()
                .seqEach(this.$providers, function (provider, cb) {
                    provider.isAuthorized(context, authorizationRequest, function (err, isAuthorized) {
                        if (!err && isAuthorized) {
                            authorized = isAuthorized;
                            authorizationRequest.$isAuthorized = true;
                            cb.end();
                        } else {
                            cb(err);
                        }
                    });
                })
                .exec(function (err) {
                    callback(err, authorized);
                });
        }
    });
});