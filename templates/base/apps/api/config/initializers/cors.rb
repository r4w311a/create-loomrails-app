Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins Rails.env.development? \
      ? %r{\Ahttps?://(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|192\.168\.\d+\.\d+)(:\d+)?\z}
      : ENV.fetch("FRONTEND_URL", "")

    resource "*",
      headers: :any,
      methods: [:get, :post, :put, :patch, :delete, :options, :head],
      credentials: true
  end
end
