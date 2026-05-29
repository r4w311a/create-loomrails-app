if defined?(Typelizer)
  Typelizer.configure do |config|
    # Output directory for TypeScript definitions
    config.output_directory = Rails.root.join("../../packages/types/src")
  end
end
