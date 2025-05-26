const path = require('path')

module.exports = (env, options) => {
  return {
    mode: options.mode || 'production',
    cache: true,
    optimization: {
      minimize: options.mode === 'production',
      splitChunks: {
        chunks: 'all',
        name: 'vendors',
      },
    },
    entry: {
      index: ['babel-polyfill', './src/popup/index.js'],
    },
    output: {
      path: path.join(__dirname, '/dist'),
      filename: '[name].bundle.js',
      chunkFilename: '[name].bundle.js',
    },
    module: {
      rules: [
        {
          test: /\.(js|jsx)$/,
          exclude: /nodeModules/,
          use: {
            loader: 'babel-loader',
          },
        },
        {
          test: /\.(png|jpe?g|gif|svg)$/i,
          use: [
            {
              loader: 'file-loader',
            },
          ],
        },
        {
          test: /\.(woff(2)?|ttf|otf|eot)(\?v=\d+\.\d+\.\d+)?$/,
          use: [
            {
              loader: 'file-loader',
              options: {
                name: '[name].[ext]',
                outputPath: 'fonts/',
              },
            },
          ],
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader'],
        },
        {
          test: /\.s[ac]ss$/i,
          use: [
            // Creates `style` nodes from JS strings
            'style-loader',
            // Translates CSS into CommonJS
            'css-loader',
            // Compiles Sass to CSS
            {
              loader: 'sass-loader',
              options: {
                implementation: require('sass'),
                sassOptions: {
                  quietDeps: true,
                },
              },
            },
          ],
        },
      ],
    },
    performance: {
      hints: false,
    },
    ignoreWarnings: [
      {
        module: /sass-loader/,
        message: /The legacy JS API is deprecated/, 
      },
    ],
  }
}
