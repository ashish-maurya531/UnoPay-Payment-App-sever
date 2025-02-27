module.exports = {
    apps: [
      {
        name: "unopay1",
        script: "index.js",
        instances: "4",
        exec_mode: "cluster",
        env: {
          NODE_OPTIONS: "--max-old-space-size=1024"
        }
      }
    ]
  };
  