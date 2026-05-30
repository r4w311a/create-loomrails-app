require "json"

namespace :openapi do
  desc "Generate the starter OpenAPI contract consumed by @hey-api/openapi-ts"
  task generate: :environment do
    output_path = Rails.root.join("../../packages/types/openapi.json").expand_path
    FileUtils.mkdir_p(output_path.dirname)
    File.write(output_path, JSON.pretty_generate(LoomRailsOpenapi.spec))
    puts "Generated #{output_path}"
  end
end

module LoomRailsOpenapi
  module_function

  def spec
    {
      openapi: "3.1.0",
      info: {
        title: "LoomRails API",
        version: "1.0.0"
      },
      servers: [
        { url: "http://localhost:3000/api/v1", description: "Local Rails API" }
      ],
      paths: {
        "/signup" => auth_path("Create an account", "signup", "201"),
        "/login" => auth_path("Sign in", "login", "200"),
        "/logout" => logout_path,
        "/me" => me_path
      },
      components: {
        responses: {
          Error: error_response
        },
        schemas: schemas
      }
    }
  end

  def auth_path(summary, operation_id, success_status)
    {
      post: {
        summary: summary,
        operationId: operation_id,
        requestBody: {
          required: true,
          content: {
            "application/json" => {
              schema: { "$ref" => "#/components/schemas/AuthRequest" }
            }
          }
        },
        responses: {
          success_status => {
            description: "Authenticated user",
            content: {
              "application/json" => {
                schema: { "$ref" => "#/components/schemas/AuthResponse" }
              }
            }
          },
          "401" => { "$ref" => "#/components/responses/Error" },
          "422" => { "$ref" => "#/components/responses/Error" }
        }
      }
    }
  end

  def logout_path
    {
      delete: {
        summary: "Sign out",
        operationId: "logout",
        responses: {
          "200" => {
            description: "Logout confirmation",
            content: {
              "application/json" => {
                schema: { "$ref" => "#/components/schemas/MessageResponse" }
              }
            }
          }
        }
      }
    }
  end

  def me_path
    {
      get: {
        summary: "Fetch the current session",
        operationId: "getCurrentUser",
        responses: {
          "200" => {
            description: "Current user or null",
            content: {
              "application/json" => {
                schema: { "$ref" => "#/components/schemas/CurrentUserResponse" }
              }
            }
          },
          "401" => { "$ref" => "#/components/responses/Error" }
        }
      }
    }
  end

  def error_response
    {
      description: "Error response",
      content: {
        "application/json" => {
          schema: { "$ref" => "#/components/schemas/ErrorResponse" }
        }
      }
    }
  end

  def schemas
    {
      AuthRequest: {
        type: "object",
        required: %w[email password],
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string", minLength: 6 }
        }
      },
      User: {
        type: "object",
        required: %w[id email],
        properties: {
          id: { type: "integer" },
          email: { type: "string", format: "email" }
        }
      },
      AuthResponse: {
        type: "object",
        required: %w[user],
        properties: {
          token: { type: "string", description: "Only returned for mobile clients." },
          user: { "$ref" => "#/components/schemas/User" }
        }
      },
      CurrentUserResponse: {
        type: "object",
        required: %w[user],
        properties: {
          user: {
            oneOf: [
              { "$ref" => "#/components/schemas/User" },
              { type: "null" }
            ]
          }
        }
      },
      MessageResponse: {
        type: "object",
        required: %w[message],
        properties: {
          message: { type: "string" }
        }
      },
      ErrorResponse: {
        type: "object",
        required: %w[error],
        properties: {
          error: { type: "string" }
        }
      }
    }
  end
end
