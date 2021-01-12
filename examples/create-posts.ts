import createClient from "../client.ts";

const config = {
  username: "user",
  password: "pass",
  url: "http://my-local-dev-site.test",
};

const batch = {
  common: {
    postType: "my_post_type",
    wp: {
      status: "publish",
      my_custom_taxonomy: [69],
    },
  },
  posts: [
    {
      wp: {
        title: "Post #1",
      },
      acf: {
        my_custom_field: "Custom field value",
      },
    },
  ],
};

const client = createClient(config);

await client.bulkCreate(batch);
