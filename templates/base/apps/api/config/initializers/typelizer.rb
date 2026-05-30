if defined?(Typelizer)
  Typelizer.configure do |config|
    # Output directory for TypeScript definitions
    config.output_dir = Rails.root.join("../../packages/types/src/models")
  end
end
