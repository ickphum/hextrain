import globals from "globals";
import pluginJs from "@eslint/js";
import pluginReact from "eslint-plugin-react";

export default [
    {
        ignores: [ "node_modules/*", "dist/*" ]
    }, 
    {
        files:   [ '**/*.{js,jsx,mjs,cjs,ts,tsx}' ],

        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node
            },

            ecmaVersion: "latest",
            sourceType:  "module",

            parserOptions: {
                ecmaFeatures: {
                    impliedStrict: true,
                    jsx:           true
                }
            }
        },
        settings: {
            react: {
                "createClass":    "createReactClass", 
                // Regex for Component Factory to use,
                // default to "createReactClass"
                "pragma":         "React",    // Pragma to use, default to "React"
                "fragment":       "Fragment",  // Fragment to use (may be a property of <pragma>), default to "Fragment"
                "version":        "detect",  
                // React version. "detect" automatically picks the version you have installed.
                // You can also use `16.0`, `16.3`, etc, if you want to override the detected value.
                // Defaults to the "defaultVersion" setting and warns if missing, and to "detect" in the future
                "defaultVersion": "", 
                // Default React version to use when the version you have installed cannot be detected.
                // If not provided, defaults to the latest React version.
                "flowVersion":    "0.53" // Flow version
            },
            "propWrapperFunctions": [
                // The names of any function used to wrap propTypes, e.g. `forbidExtraProps`. If this isn't set, any propTypes wrapped in a function will be skipped.
                "forbidExtraProps",
                { "property": "freeze", "object": "Object" },
                { "property": "myFavoriteWrapper" },
                // for rules that check exact prop wrappers
                { "property": "forbidExtraProps", "exact": true }
            ],
            "componentWrapperFunctions": [
                // The name of any function used to wrap components, e.g. Mobx `observer` function. If this isn't set, components wrapped by these functions will be skipped.
                "observer", // `property`
                { "property": "styled" }, // `object` is optional
                { "property": "observer", "object": "Mobx" },
                { "property": "observer", "object": "<pragma>" } // sets `object` to whatever value `settings.react.pragma` is set to
            ],
            "formComponents": [
                // Components used as alternatives to <form> for forms, eg. <Form endpoint={ url } />
                "CustomForm",
                { "name": "SimpleForm", "formAttribute": "endpoint" },
                { "name": "Form", "formAttribute": [ "registerEndpoint", "loginEndpoint" ] } // allows specifying multiple properties if necessary
            ],
            "linkComponents": [
                // Components used as alternatives to <a> for linking, eg. <Link to={ url } />
                "Hyperlink",
                { "name": "MyLink", "linkAttribute": "to" },
                { "name": "Link", "linkAttribute": [ "to", "href" ] } // allows specifying multiple properties if necessary
            ]
        },

        rules: {
            "react/jsx-uses-react":         0,
            "react/react-in-jsx-scope":     0,
            "no-use-before-define":         "off",
            "func-call-spacing":            [ 2, "never" ],
            "prefer-promise-reject-errors": 2,
            "max-len":                      [ "warn", 180 ],
            "max-depth":                    [ "error", 5 ],
            "max-lines":                    [ "error", 1500 ],
            "max-params":                   [ "error", 5 ],

            "max-statements": [
                "error", 35, {
                    ignoreTopLevelFunctions: true
                }
            ],

            "accessor-pairs": "off",

            "arrow-spacing": [
                2, {
                    before: true,
                    after:  true
                }
            ],

            "brace-style":  "off",
            camelcase:      "off",
            "comma-dangle": [ 2, "never" ],

            "comma-spacing": [
                2, {
                    before: false,
                    after:  true
                }
            ],

            "comma-style":       [ 2, "last" ],
            "constructor-super": 2,
            curly:               [ 1, "multi-or-nest" ],
            "dot-location":      [ 2, "property" ],
            "eol-last":          2,
            eqeqeq:              [ 0, "allow-null" ],

            "generator-star-spacing": [
                2, {
                    before: true,
                    after:  false
                }
            ],

            "handle-callback-err": [ 2, "^(err|error)$" ],

            indent: [
                1, 4, {
                    SwitchCase:       1,
                    MemberExpression: 1,
                    ObjectExpression: 1,

                    CallExpression: {
                        arguments: 1
                    }
                }
            ],

            "key-spacing": [
                2, {
                    mode:  "minimum",
                    align: "value"
                }
            ],

            "keyword-spacing": [
                2, {
                    before: true,
                    after:  true
                }
            ],

            "new-cap": [
                0, {
                    newIsCap: true,
                    capIsNew: false
                }
            ],

            "no-alert":                 2,
            "no-caller":                2,
            "new-parens":               2,
            "no-array-constructor":     2,
            "no-class-assign":          2,
            "no-cond-assign":           2,
            "no-const-assign":          2,
            "no-control-regex":         0,
            "no-debugger":              2,
            "no-delete-var":            2,
            "no-dupe-args":             2,
            "no-dupe-class-members":    2,
            "no-dupe-keys":             2,
            "no-duplicate-case":        2,
            "no-duplicate-imports":     2,
            "no-empty-character-class": 2,
            "no-empty-pattern":         2,
            "no-eval":                  2,
            "no-ex-assign":             2,
            "no-extend-native":         2,
            "no-extra-bind":            2,
            "no-extra-boolean-cast":    2,
            "arrow-parens":             [ "error", "as-needed" ],

            "no-fallthrough": [
                2, {
                    commentPattern: ".*(?:fall|thr(?:u|ough)).*"
                }
            ],

            "no-floating-decimal":     2,
            "no-func-assign":          2,
            "no-implied-eval":         2,
            "no-inner-declarations":   [ 2, "functions" ],
            "guard-for-in":            1,
            "no-trailing-spaces":      "off",
            "no-invalid-regexp":       2,
            "no-irregular-whitespace": "off",
            "no-iterator":             2,
            "no-label-var":            2,

            "no-labels": [
                2, {
                    allowLoop:   false,
                    allowSwitch: false
                }
            ],

            "no-lone-blocks":           2,
            "no-mixed-spaces-and-tabs": 2,
            "no-multi-spaces":          "off",
            "no-multi-str":             2,

            "no-multiple-empty-lines": [
                2, {
                    max: 4
                }
            ],

            "no-native-reassign":           2,
            "no-negated-in-lhs":            2,
            "no-new":                       2,
            "no-new-func":                  1,
            "no-new-object":                2,
            "no-new-require":               2,
            "no-new-symbol":                2,
            "no-new-wrappers":              2,
            "no-obj-calls":                 2,
            "no-octal":                     2,
            "no-octal-escape":              2,
            "no-path-concat":               2,
            "no-proto":                     2,
            "no-redeclare":                 2,
            "no-regex-spaces":              2,
            "no-return-assign":             "off",
            "no-self-assign":               2,
            "no-self-compare":              1,
            "no-sequences":                 "off",
            "no-shadow-restricted-names":   2,
            "no-spaced-func":               2,
            "no-sparse-arrays":             0,
            "no-this-before-super":         2,
            "no-throw-literal":             2,
            "no-undef":                     2,
            "no-undef-init":                2,
            "no-unexpected-multiline":      2,
            "no-unmodified-loop-condition": 2,
            "multiline-ternary":            0,

            "no-unneeded-ternary": [
                2, {
                    defaultAssignment: false
                }
            ],

            "no-unreachable":                2,
            "no-unsafe-finally":             2,
            "no-unused-vars":                "warn",
            "no-useless-call":               2,
            "no-useless-return":             2,
            "no-useless-computed-key":       2,
            "no-useless-constructor":        2,
            "no-useless-escape":             2,
            "no-whitespace-before-property": 2,
            "no-with":                       2,

            "one-var": [
                1, {
                    var: "always"
                }
            ],

            "operator-linebreak": [
                2, "after", {
                    overrides: {
                        "?": "before",
                        ":": "before"
                    }
                }
            ],

            "padded-blocks": "off",
            quotes:          "off",

            "require-jsdoc": [
                0, {
                    require: {
                        FunctionDeclaration: true,
                        MethodDefinition:    true,
                        ClassDeclaration:    true
                    }
                }
            ],

            semi: [ 2, "always" ],

            "semi-spacing": [
                2, {
                    before: false,
                    after:  true
                }
            ],

            "space-before-blocks": [ 2, "always" ],

            "space-before-function-paren": [
                2, {
                    anonymous:  "never",
                    named:      "never",
                    asyncArrow: "always"
                }
            ],

            "space-in-parens": [
                2, "always", {
                    exceptions: [ "{}", "[]" ]
                }
            ],

            "space-infix-ops": 2,

            "space-unary-ops": [
                2, {
                    words:    true,
                    nonwords: false
                }
            ],

            "spaced-comment": [
                2, "always", {
                    markers:    [ "global", "globals", "eslint", "eslint-disable", "*package", "!", "," ],
                    exceptions: [ "*" ]
                }
            ],

            "template-curly-spacing": [ 2, "never" ],
            "use-isnan":              2,
            "valid-typeof":           2,
            "wrap-iife":              [ 2, "any" ],
            "yield-star-spacing":     [ 2, "before" ],
            yoda:                     [ 2, "never" ],

            "array-bracket-newline": [
                1, {
                    multiline: true
                }
            ],

            "array-bracket-spacing":     [ 2, "always" ],
            "object-curly-spacing":      [ 2, "always" ],
            "block-spacing":             [ 2, "always" ],
            "computed-property-spacing": [ 1, "always" ],

            "no-restricted-syntax": [
                "error", {
                    selector: "MemberExpression[object.name=/^(?:describe|it)$/][property.name='only']",
                    message:  "Do not commit `only`s."
                }, {
                    selector: "MemberExpression[object.name=/^(?:describe|it)$/][property.name='skip']",
                    message:  "Do not commit `skip`s."
                }
            ]
        }
    },    
    pluginJs.configs.recommended,
    pluginReact.configs.flat.recommended
];
