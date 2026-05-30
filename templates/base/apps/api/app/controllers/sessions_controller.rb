class SessionsController < ApplicationController
  # Allow login without being authenticated
  skip_before_action :authenticate, only: :create

  def create
    user = User.find_by(email: params[:email])

    if user&.authenticate(params[:password])
      token = issue_token(user)

      # Dual-Strategy: Web sets cookie, Mobile gets JSON body
      if request.headers["X-Client-Type"] == "mobile"
        render json: { token: token, user: { id: user.id, email: user.email } }, status: :ok
      else
        cookies.signed[:jwt_token] = {
          value: token,
          httponly: true,
          secure: Rails.env.production?,
          same_site: :strict,
          expires: 24.hours.from_now
        }
        render json: { user: { id: user.id, email: user.email } }, status: :ok
      end
    else
      render json: { error: "Invalid email or password" }, status: :unauthorized
    end
  end

  def destroy
    cookies.delete(:jwt_token)
    render json: { message: "Logged out successfully" }, status: :ok
  end
end
