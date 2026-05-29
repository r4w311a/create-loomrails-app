class RegistrationsController < ApplicationController
  skip_before_action :authenticate, only: [:create]

  def create
    user = User.new(email: params[:email], password: params[:password])

    if user.save
      token = issue_token(user)

      if request.headers["X-Client-Type"] == "mobile"
        render json: { token: token, user: { id: user.id, email: user.email } }, status: :created
      else
        cookies.signed[:jwt_token] = {
          value: token,
          httponly: true,
          secure: Rails.env.production?,
          same_site: :strict,
          expires: 24.hours.from_now
        }
        render json: { user: { id: user.id, email: user.email } }, status: :created
      end
    else
      render json: { error: user.errors.full_messages.to_sentence }, status: :unprocessable_entity
    end
  end
end
