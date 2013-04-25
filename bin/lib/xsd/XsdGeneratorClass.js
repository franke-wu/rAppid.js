define(["js/core/Application"], function (Application) {

    return Application.inherit("xsd.XsdGeneratorClass", {

        defaults: {
            prefix: "ns",
            targetNamespace: null
        },

        start: function (parameter, callback) {

            var targetNamespace = parameter.namespace,
                documentations = parameter.documentations,
                paket = parameter.package,
                schema = this.$.schema,
                i;

            if (!(targetNamespace && paket)) {
                callback && callback("namespace or package missing");
                return;
            }

            this.namespaceMap = {};

            schema.set("xmlns", "http://www.w3.org/2001/XMLSchema");

            for (i = 0; i < paket.imports.length; i++) {
                var prefix = "ns" + (i + 1),
                    namespace = paket.imports[i];

                schema.set("xmlns:" + prefix, namespace);
                this.namespaceMap[namespace] = prefix;

                schema.addChild(schema.$templates["import"].createComponents({
                    namespace: namespace
                })[0]);
            }

            schema.set("xmlns:ns", targetNamespace);
            schema.set("targetNamespace", targetNamespace);

            var addLater = [];

            for (i = 0; i < paket.classes.length; i++) {
                var classDocumentation = paket.classes[i];

                var name = classDocumentation.fqClassName.split(".").pop();

                schema.addChild(schema.$templates["element"].createComponents({
                    $element: name
                })[0]);

                var inheritFrom = classDocumentation.inherit,
                    baseType,
                    documentationSource = "http://www.rappidjs.com/#/api/" + classDocumentation.fqClassName,
                    documentation = (classDocumentation.summary ? classDocumentation.summary + "\n\n" : "") + (classDocumentation.description || "");

                if (documentations.hasOwnProperty(inheritFrom)) {
                    baseType = documentations[inheritFrom];
                    prefix = this.namespaceMap[baseType.package];

                    if (baseType.package === targetNamespace) {
                        prefix = "ns";
                    }

                    baseType = prefix + ":" + inheritFrom.split(".").pop();

                } else {
                    console.warn("cannot find base type");
                }

                var isComponent = classDocumentation.fqClassName === "js.core.Component";

                if (isComponent) {
                    baseType = "anyType";
                }

                var typeComponent = schema.$templates["type"].createComponents({
                    $type: {
                        name: name,
                        baseType: baseType,
                        documentationSource: documentationSource,
                        documentation: documentation,
                        isComponent: isComponent
                    }
                })[0];

                typeComponent._initialize("auto");

                var extension = typeComponent.$children[0].$children[0];

                for (var key in classDocumentation.defaults) {
                    if (classDocumentation.defaults.hasOwnProperty(key)) {
                        var attribute = classDocumentation.defaults[key];

                        if (attribute.visibility === "public" &&
                                (isComponent || attribute.definedBy === classDocumentation.fqClassName || attribute.definedBy === classDocumentation.fqClassName + "Class")) {

                            var attributeComponent = schema.$templates["attribute"].createComponents({
                                $attribute: attribute
                            })[0];

                            if (attribute.defaultType === "value" && attribute.value) {
                                attributeComponent.set("default", attribute.value);
                            }

                            extension.addChild(attributeComponent);
                        }
                    }
                }

                addLater.push(typeComponent);

            }

            for (var j = 0; j < addLater.length; j++) {
                schema.addChild(addLater[j]);

            }


            this.callBase();

        },

        _isStyleAttribute: function () {
            return false;
        },

        namespaceToPrefix: function (namespace) {
            var parts = namespace.split(".");

            for (var i = 0; i < parts.length; i++) {
                var obj = parts[i];

            }

        }

    });

});