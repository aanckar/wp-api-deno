export type Config = {
  username: string;
  password: string;
  url: string;
};

export type Post = {
  postType?: string;
  wp: {
    [key: string]: string | string[] | number | number[];
  };
  acf?: Object;
};

export type PostBatch = {
  common?: Post;
  posts: Post[];
};

export default function createClient(config: Config) {
  async function doRequest(path: string, data: FormData | Object) {
    const isFormData = data instanceof FormData;
    const res = await fetch(`${config.url}/${path}`, {
      method: "POST",
      headers: {
        ...(!isFormData ? { "Content-Type": "application/json" } : null),
        Authorization: `Basic ${btoa(`${config.username}:${config.password}`)}`,
      },
      body: isFormData ? (data as FormData) : JSON.stringify(data),
    });
    const json = await res.json();
    return {
      error: !res.ok ? res.statusText : null,
      data: json,
    };
  }

  async function create(post: Post) {
    const res = await doRequest(`/wp-json/wp/v2/${post.postType}`, post.wp);
    if (post.acf && res?.data?.id) {
      const formData = new FormData();
      Object.entries(post.acf).forEach(([key, value]) => {
        formData.append(`fields[${key}]`, value);
      });
      await doRequest(
        `/wp-json/acf/v3/${post.postType}/${res.data.id}`,
        formData
      );
    }
    console.log(
      res.error
        ? `Error: ${res.error}`
        : `Created new post "${post.wp.title}" with ID ${res.data.id}`
    );
  }

  async function bulkCreate(batch: PostBatch) {
    const posts = <Post[]>batch.posts.map((post) => ({
      ...batch.common,
      ...post,
      wp: {
        ...batch.common?.wp,
        ...post.wp,
      },
      ...(batch.common?.acf || post.acf
        ? {
            acf: {
              ...batch.common?.acf,
              ...post?.acf,
            },
          }
        : null),
    }));
    let index = 1;
    for await (const post of posts) {
      console.log(`Post ${index} / ${posts.length}:`);
      await create(post);
      index++;
    }
  }

  return { create, bulkCreate };
}
