class ProfilesController < ApplicationController
  skip_before_action :authenticate, only: [:show]

  def show
    if (user = authenticate_by_token)
      render json: { user: { id: user.id, email: user.email } }, status: :ok
    else
      render json: { user: null }, status: :ok
    end
  end
end
