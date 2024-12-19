# frozen_string_literal: true

class Api::UsersController < ApplicationController
  def index
    users = User.all

    render json: users.to_json
  end
end