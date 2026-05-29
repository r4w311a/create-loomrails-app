module Authentication
  extend ActiveSupport::Concern

  included do
    before_action :authenticate
  end

  private

  def authenticate
    if (user = authenticate_by_token)
      Current.user = user
    else
      render json: { error: "Unauthorized" }, status: :unauthorized
    end
  end

  def authenticate_by_token
    token = extract_token
    return nil if token.blank?

    begin
      payload = JWT.decode(token, Rails.application.credentials.secret_key_base || "fallback_secret", true, { algorithm: "HS256" }).first
      User.find_by(id: payload["user_id"])
    rescue JWT::DecodeError
      nil
    end
  end

  def extract_token
    # Strategy A: Check Authorization Header (Bearer token for Mobile App)
    auth_header = request.headers["Authorization"]
    if auth_header.present? && auth_header.start_with?("Bearer ")
      return auth_header.split(" ").last
    end

    # Strategy B: Check HttpOnly Cookies (Signed Cookie for Web SPA)
    cookies.signed[:jwt_token]
  end

  def issue_token(user)
    payload = { user_id: user.id, exp: 24.hours.from_now.to_i }
    JWT.encode(payload, Rails.application.credentials.secret_key_base || "fallback_secret", "HS256")
  end
end
