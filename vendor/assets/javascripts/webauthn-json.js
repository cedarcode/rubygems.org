// Generated with rollup.js
// webauthn-json v0.3.1
//
// Source: https://github.com/github/webauthn-json/tree/v0.3.1
// License: MIT - https://github.com/github/webauthn-json/blob/v0.3.1/LICENSE.md

(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = global || self, factory(global.webauthnJSON = {}));
}(this, function (exports) { 'use strict';

  function base64urlToBuffer(baseurl64String) {
      // Base64url to Base64
      const padding = "==".slice(0, (4 - (baseurl64String.length % 4)) % 4);
      const base64String = baseurl64String.replace(/-/g, "+").replace(/_/g, "/") + padding;
      // Base64 to binary string
      const str = atob(base64String);
      // Binary string to buffer
      const buffer = new ArrayBuffer(str.length);
      const byteView = new Uint8Array(buffer);
      for (let i = 0; i < str.length; i++) {
          byteView[i] = str.charCodeAt(i);
      }
      return buffer;
  }
  function bufferToBase64url(buffer) {
      // Buffer to binary string
      const byteView = new Uint8Array(buffer);
      let str = "";
      for (const charCode of byteView) {
          str += String.fromCharCode(charCode);
      }
      // Binary string to base64
      const base64String = btoa(str);
      // Base64 to base64url
      // We assume that the base64 string is well-formed.
      const base64urlString = base64String.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
      return base64urlString;
  }

  // We export these values in order so that they can be used to deduplicate
  // schema definitions in minified JS code.
  const copyValue = "copy";
  const convertValue = "convert";
  function convert(conversionFn, schema, input) {
      if (schema === copyValue) {
          return input;
      }
      if (schema === convertValue) {
          return conversionFn(input);
      }
      if (schema instanceof Array) {
          return input.map((v) => convert(conversionFn, schema[0], v));
      }
      if (schema instanceof Object) {
          const output = {};
          for (const [key, schemaField] of Object.entries(schema)) {
              if (!(key in input)) {
                  if (schemaField.required) {
                      throw new Error(`Missing key: ${key}`);
                  }
                  continue;
              }
              // Fields can be null (rather than missing or `undefined`), e.g. the
              // `userHandle` field of the `AuthenticatorAssertionResponse`:
              // https://www.w3.org/TR/webauthn/#iface-authenticatorassertionresponse
              if (input[key] == null) {
                  output[key] = null;
                  continue;
              }
              output[key] = convert(conversionFn, schemaField.schema, input[key]);
          }
          return output;
      }
  }
  function required(schema) {
      return {
          required: true,
          schema,
      };
  }
  function optional(schema) {
      return {
          required: false,
          schema,
      };
  }

  // Shared by `create()` and `get()`.
  const publicKeyCredentialDescriptorSchema = {
      type: required(copyValue),
      id: required(convertValue),
      transports: optional(copyValue),
  };
  // `navigator.create()` request
  const credentialCreationOptions = {
      publicKey: required({
          rp: required(copyValue),
          user: required({
              id: required(convertValue),
              name: required(copyValue),
              displayName: required(copyValue),
              icon: optional(copyValue),
          }),
          challenge: required(convertValue),
          pubKeyCredParams: required(copyValue),
          timeout: optional(copyValue),
          excludeCredentials: optional([publicKeyCredentialDescriptorSchema]),
          authenticatorSelection: optional(copyValue),
          attestation: optional(copyValue),
          extensions: optional(copyValue),
      }),
      signal: optional(copyValue),
  };
  // `navigator.create()` response
  const publicKeyCredentialWithAttestation = {
      type: required(copyValue),
      id: required(copyValue),
      rawId: required(convertValue),
      response: required({
          clientDataJSON: required(convertValue),
          attestationObject: required(convertValue),
      }),
  };
  // `navigator.get()` request
  const credentialRequestOptions = {
      unmediated: optional(copyValue),
      mediation: optional(copyValue),
      publicKey: required({
          challenge: required(convertValue),
          timeout: optional(copyValue),
          rpId: optional(copyValue),
          allowCredentials: optional([publicKeyCredentialDescriptorSchema]),
          userVerification: optional(copyValue),
          extensions: optional(copyValue),
      }),
      signal: optional(copyValue),
  };
  // `navigator.get()` response
  const publicKeyCredentialWithAssertion = {
      type: required(copyValue),
      id: required(copyValue),
      rawId: required(convertValue),
      response: required({
          clientDataJSON: required(convertValue),
          authenticatorData: required(convertValue),
          signature: required(convertValue),
          userHandle: required(convertValue),
      }),
  };
  const schema = {
      credentialCreationOptions,
      publicKeyCredentialWithAttestation,
      credentialRequestOptions,
      publicKeyCredentialWithAssertion,
  };

  async function create(requestJSON) {
      const request = convert(base64urlToBuffer, credentialCreationOptions, requestJSON);
      const credential = (await navigator.credentials.create(request));
      return convert(bufferToBase64url, publicKeyCredentialWithAttestation, credential);
  }
  async function get(requestJSON) {
      const request = convert(base64urlToBuffer, credentialRequestOptions, requestJSON);
      const response = (await navigator.credentials.get(request));
      return convert(bufferToBase64url, publicKeyCredentialWithAssertion, response);
  }
  // This function does a simple check to test for the credential management API
  // functions we need, and an indication of public credential authentication
  // support.
  // https://developers.google.com/web/updates/2018/03/webauthn-credential-management
  function supported() {
      return !!(navigator.credentials && navigator.credentials.create && navigator.credentials.get && window.PublicKeyCredential);
  }

  exports.create = create;
  exports.get = get;
  exports.schema = schema;
  exports.supported = supported;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
