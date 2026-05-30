require "test_helper"

class AuthenticationFlowTest < ActionDispatch::IntegrationTest
  test "web signup, session check, and logout use http only cookie flow" do
    assert_difference("User.count", 1) do
      post "/api/v1/signup", params: { email: "web@example.com", password: "password" }, as: :json
    end

    assert_response :created
    assert_equal "web@example.com", response.parsed_body.dig("user", "email")
    assert_nil response.parsed_body["token"]

    get "/api/v1/me", as: :json

    assert_response :success
    assert_equal "web@example.com", response.parsed_body.dig("user", "email")

    delete "/api/v1/logout", as: :json

    assert_response :success

    get "/api/v1/me", as: :json

    assert_response :success
    assert_nil response.parsed_body["user"]
  end

  test "mobile signup returns bearer token for secure device storage" do
    post "/api/v1/signup",
      params: { email: "mobile@example.com", password: "password" },
      headers: { "X-Client-Type" => "mobile" },
      as: :json

    assert_response :created
    assert_equal "mobile@example.com", response.parsed_body.dig("user", "email")
    assert response.parsed_body["token"].present?

    get "/api/v1/me", headers: { "Authorization" => "Bearer #{response.parsed_body["token"]}" }, as: :json

    assert_response :success
    assert_equal "mobile@example.com", response.parsed_body.dig("user", "email")
  end

  test "invalid login returns unauthorized" do
    post "/api/v1/login", params: { email: "missing@example.com", password: "password" }, as: :json

    assert_response :unauthorized
    assert_equal "Invalid email or password", response.parsed_body["error"]
  end
end
