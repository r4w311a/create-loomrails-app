Rails.application.routes.draw do
  scope "/api/v1", defaults: { format: :json } do
    post "login", to: "sessions#create"
    post "signup", to: "registrations#create"
    delete "logout", to: "sessions#destroy"
    get "me", to: "profiles#show"
  end

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check
end
