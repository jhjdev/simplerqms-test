class InitSchema < ActiveRecord::Migration[8.0]
  def change
    create_table("groups", if_not_exists: true) do |t|
      t.string :name

      t.timestamps
    end

    create_table("users", if_not_exists: true) do |t|
      t.string :name
      t.string :email, null: false
    end
  end
end
