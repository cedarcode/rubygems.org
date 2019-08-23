require "securerandom"
require "test_helper"
require "webauthn/fake_client"

class WebauthnCredentialsControllerTest < ActionController::TestCase
  context "when logged in" do
    setup do
      @user = create(:user)
      sign_in_as(@user)
    end

    context "when webauthn enabled" do
      setup do
        @fake_client = WebAuthn::FakeClient.new("http://test.host", encoding: :base64url)
        public_key_credential = WebAuthn::PublicKeyCredential.from_create(@fake_client.create)
        encoder = WebAuthn::Encoder.new
        @user.webauthn_credentials.create(
          external_id: public_key_credential.id,
          public_key: encoder.encode(public_key_credential.public_key),
          nickname: "USB key"
        )
      end

      context "on GET to /webauthn_credentials" do
        setup do
          get :index
        end

        should respond_with :success
        should "list credential" do
          credential = @user.webauthn_credentials.take
          assert page.has_content? "#{credential.nickname} - registered on #{credential.created_at.to_date.to_s(:long)}"
        end
      end

      context "on DELETE to /webauthn_credentials/:id" do
        setup do
          delete :destroy, params: { id: @user.webauthn_credentials.take.id }

          @user.reload
        end

        should respond_with :redirect
        should "have deleted credential" do
          assert @user.webauthn_credentials.none?
        end
        should "have webauthn disabled" do
          refute @user.webauthn_enabled?
        end
      end
    end

    context "when webauthn disabled" do
      context "on GET to /webauthn_credentials" do
        setup do
          get :index
        end

        should respond_with :success
        should "list no credential" do
          assert page.has_content? "You have no WebAuthn credentials registered yet"
        end
        should "offer to add credentials" do
          assert page.has_button? "Add a new WebAuthn credential"
        end
      end

      context "on POST to /webauthn_credentials" do
        setup do
          challenge = SecureRandom.random_bytes(32)
          encoder = WebAuthn::Encoder.new
          fake_client = WebAuthn::FakeClient.new("http://test.host", encoding: :base64url)
          @controller.session[:webauthn_challenge] = encoder.encode(challenge)

          @client_credential = fake_client.create(challenge: challenge)
          params = @client_credential
          params["nickname"] = "A nickname"

          post :create, params: params
        end

        should respond_with :success
        should "create a credential" do
          assert_equal 1, @user.webauthn_credentials.count
          credential = @user.webauthn_credentials.take
          assert_equal @client_credential["rawId"], credential.external_id
          assert credential.public_key
        end
      end
    end
  end
end
