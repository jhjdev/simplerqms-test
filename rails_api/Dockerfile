# syntax=docker/dockerfile:1
# check=error=true


# Make sure RUBY_VERSION matches the Ruby version in .ruby-version
ARG RUBY_VERSION=3.3.4
FROM docker.io/library/ruby:$RUBY_VERSION-slim AS base

# Rails app lives here
WORKDIR /usr/src/app

# Install base packages
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y postgresql-client vim curl libvips \
    build-essential git libpq-dev pkg-config \
    && rm -rf /var/lib/apt/lists /var/cache/apt/archives


# Install application gems
COPY Gemfile Gemfile.lock ./
RUN bundle install && \
    rm -rf ~/.bundle/ "${BUNDLE_PATH}"/ruby/*/cache "${BUNDLE_PATH}"/ruby/*/bundler/gems/*/.git && \
    bundle exec bootsnap precompile --gemfile

# Copy application code
COPY . .

# Precompile bootsnap code for faster boot times
RUN bundle exec bootsnap precompile app/ lib/



# Entrypoint prepares the database.
ENTRYPOINT ["/usr/src/app/bin/docker-entrypoint"]

EXPOSE 3000
CMD ["./bin/rails", "server", "-b", "0.0.0.0"]
