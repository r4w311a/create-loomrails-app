class ProfilesController < ApplicationController
  def show
    render json: { user: { id: Current.user.id, email: Current.user.email } }, status: :ok
  end
end
