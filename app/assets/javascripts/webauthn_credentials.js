$(function(){
  if(!webauthnJSON.supported()) {
    if($("#unsupported-browser-message").length) {
      $("#unsupported-browser-message").show();

      if($("#sign-in-button").length) {
        $("#sign-in-button").prop("disabled", true);
      } else if($("#register-credential-button").length) {
        $("#register-credential-button").prop("disabled", true);
      }
    }
  }
});

var registerCredentialForm = $("#webauthn-credential-create");
if(registerCredentialForm.length) {
  registerCredentialForm.submit(registrationHandler);
}

var signInButton = $(".js-webauthn-credential-authenticate");
if(signInButton.length) {
  signInButton.parent().submit(event => { event.preventDefault() });
  signInButton.click(signInHandler);
}

function registrationHandler(event) {
  event.preventDefault();

  $.get({
    url: "/webauthn_credentials/create_options",
    dataType: "json",
  }).done(options => {
    webauthnJSON.create({ "publicKey": options }).then(
      credential => {
        callback("/webauthn_credentials", $.extend(credential, { "nickname": $("#nickname").val() }));
      },
      reason => {
        var registerButton = registerCredentialForm.find("input.form__submit");
        registerButton.attr('value', registerButton.attr('data-enable-with'));
        registerButton.prop('disabled', false);
      });
  }).fail(response => { console.log(response) })
}

function signInHandler(event) {
  $.get({
    url: "/session/webauthn_authentication_options",
    dataType: "json"
  }).done(options => {
    webauthnJSON.get({ "publicKey": options }).then(
      credential => {
        callback("session/webauthn_authentication", credential);
      },
      reason => {
        signInButton.attr('value', signInButton.attr('data-enable-with'));
        signInButton.prop('disabled', false);
      });
  }).fail(response => { window.location.replace(response.responseJSON["redirect_path"]) })
}

function callback(url, body) {
  $.post({
    url: url,
    data: JSON.stringify(body),
    dataType: "json",
    headers: {
      "Content-Type": "application/json"
    }
  }).done(function(response) {
    window.location.replace(response["redirect_path"]);
  }).error(function(response) {
    window.location.replace(response.responseJSON["redirect_path"]);
  });
}