---
title: Trying out Astro SSR & Astro 1.0 Hackaton
published: false
description: 
tags: astro, ssr, webcomponents, hackathon
cover_image: https://imgur.com/lVh86dZ.png
---

Whew, it's been a hot minute since I blogged. 

I'd played around some with Astro in it's early beginnings, and sadly I could never quite find another excuse to build something with it. Not until recently, when the Astro team [released](https://astro.build/blog/experimental-server-side-rendering/) their new _SSR_ mode. It seemed like a good time to give Astro another spin, and before I knew, I'd built half a course selling website. So in this blog, I'll tell you all about it.

![demo](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/m5osy1mzjmd4xpweozij.gif)

## Getting started

I started my project by running `npm init astro@latest`. Being myself a fan of minimal buildtooling, complicated project setups, and loads of configuration files, I was delighted to be greeted with a `Minimal` starter project being one of the options:

```
? Which app template would you like to use? › - Use arrow-keys. Return to submit.
    Starter Kit (Generic)
    Blog
    Documentation
    Portfolio
❯   Minimal

```

> Hell yeah.

As promised, the `Minimal` starter gave me a super nice and clean project structure to get started with. Alright, now onto... What, exactly? Having little experience with Astro, and not being quite sure how one does a SSR, I figured I'd checkout some documentation. At the time of the release, not much documentation was available. There was the [announcement blog](https://astro.build/blog/experimental-server-side-rendering/), a _very_ brief [documentation page](https://docs.astro.build/en/guides/server-side-rendering/), and a [Netlify blog](https://www.netlify.com/blog/astro-ssr/). With such little documentation being available, I figured I'd follow the Netlify blog, because it seemed straight forward enough to follow, and I've used Netlify very happily in the past.

As instructed, I installed the required dependencies:

```
npm i -S @astrojs/netlify
```

Updated my config:

```diff
import { defineConfig } from 'astro/config';
+ import netlify from '@astrojs/netlify/functions';

export default defineConfig({
+  adapter: netlify()
});

```

Ran `npm start` and...

```
error Invalid URL
```

Ran into an error.

## The pain of the bleeding edge

To be fair, I'm told this is already fixed in a more recent version, and these kind of issues are to be expected when you're trying out the bleeding edge, and working with new things. The Netlify blog was missing this information, but apparently you're supposed to configure your `site` property in the `astro.config.mjs`, e.g.:

```diff
import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify/functions';

export default defineConfig({
+ site: 'https://example.com',
  adapter: netlify()
});
```

Another small issue I ran into, when trying to set multiple cookies, is that only one seemed to make it to the browser for some reason. 

Fortunately, the [Astro discord](https://astro.build/chat) has a very lively community where even core team members are around to help, so I created a [Github issue](https://github.com/withastro/astro/issues/3024), and the issue was very quickly resolved and released. (Thanks, Matthew!)

Even later on in the project, I discovered another bug when trying to render a custom element, e.g.: `<my-el></my-el>` would always render `<my-el>undefined</my-el>` in the browser, wether the custom element was upgraded or not. I created an issue for this problem [here](https://github.com/withastro/astro/issues/3070). Fortunately I was able to work around this with a super hacky solution 😄

```js
connectedCallback() {
  this.innerHTML = '';
}
```


## SSR it up

Alright, let's dive into some of the nice features that Astro SSR comes with. There are two ways you can respond to requests:

- `index.astro`
- `index.js`

Using a `.astro` file, you can use your frontmatter to execute code on the server, and then return the HTML in your template:

`[pokemon].astro`:
```jsx
---
// Code in the frontmatter gets executed on the server
// Note how we have access to the `fetch` api, as well as top level await here

const pokemon = await fetch(`https://pokeapi.co/api/v2/pokemon/${Astro.params.pokemon}`).then(r => r.json());
---
<html>
  <body>
    <h1>{pokemon.name}</h1>
  </body>
</html>
```

Or using a `.js` file, we can create a _route handler_, e.g.:

`[pokemon].js`:
```js
export async function get({pokemon}, request) {
  const pokemon = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemon}`).then(r => r.json());

  return new Response(null, {
    status: 200,
    body: JSON.stringify({ pokemon })
  });
}
```

Note that the first argument here is the route param, which is taken from the filename: `[pokemon].js`. If you're using a 'regular' filename, e.g.: `pokemon.js`, this will be undefined. The second argument is a regular [Request](https://developer.mozilla.org/en-US/docs/Web/API/Request) object, that you can use all your familiar methods on, e.g.: `await request.json()`, for example.

Route handlers are also useful for handling redirects, settings cookies, etc:

```js
export function get() {
  const headers = new Headers();

  headers.append('Set-Cookie', 'foo="bar";');
  headers.append('Location', '/');

  return new Response(null, {
    status: 302,
    headers,
  });
}
```

## Feedback

As mentioned above, the first argument that gets passed to your route handlers are the route params. However, if you're not using route params, it will be undefined. In my project, I've had to build quite a few route handlers, and I found I used the route param very rarely, which then kind of makes for an awkward function signature:

```js
// Always have to ignore the first arg :(
export function get(_, request) {}
```

### Redirect with error message

In some of my route handlers, I have to handle quite some error cases. Instinctively, I tried to do something like:

```js
export function get() {
  try {
    // error prone code 
  } catch {
    return new Response(JSON.stringify({message: 'something went wrong'}), {
      status: 302,
      headers: {'Location': '/error'}
    });
  }

  // etc
}
```

Not by the fault of Astro, but rather the HTTP spec, this won't work. After discussing how to handle this situation gracefully on the Astro discord, Matthew suggested perhaps introducing `Astro.flash`:

![flash](https://imgur.com/zOJOljK.png)

For the time being, I implemented my error redirections like this:

```js
return new Response('', {
  status: 302,
  headers: {'Location': '/error?code=SOME_ERR_ENUM'}
});
```

Where, in `error.astro`'s frontmatter, I map the `SOME_ERR_ENUM` to a helpful error message for the user.

This also brings me to another point: In the frontmatter of `.astro` files, there is an `Astro` global available that you can use to, for example, redirect: `return Astro.redirect('/');`. As far as I can tell, the `Astro` global is not available in route handlers. It would be really nice to have access to `Astro.flash` or `Astro.redirect` in route handlers. E.g.:

`route.js`:
```js
export function get() {
  try {
    // error prone code
  } catch {
    return Astro.flash('/error', 'error message');
  }

  return Astro.redirect('/success');
}
```

## Course Selling Application

Alright, enough technicality, let's take a look at the course selling website I built using Astro SSR. I've been wanting to find a nice way to create and sell some online courses, and I've been lowkey looking for a way to start doing this. This has been something thats been in the background of my mind for a while now, and Astro SSR seemed like a nice excuse for me to take some time to dive into this.

In order to build this course selling website, I used the following technologies:
- Sign in with Google/JWT for authentication, using [google-auth-library](https://www.npmjs.com/search?q=google-auth-library) and [jsonwebtoken](https://www.npmjs.com/package/jsonwebtoken)
- A free tier MongoDB on [CleverCloud](clever-cloud.com), that I interface with [mongoose](https://www.npmjs.com/package/mongoose)
- [Mollie Payments](https://mollie.com/) for handling subscriptions and (recurring) payments
- [Astro SSR](https://www.npmjs.com/package/astro), ofcourse
- [Lit](https://www.npmjs.com/package/lit) and [monaco-editor](https://www.npmjs.com/package/monaco-editor) for the interactive exercise editor in the frontend
- [Netlify](https://netlify.com/) for hosting/deployment

### Homepage

![homepage](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/ef6uysytaahra2c9nq03.gif)

### Authentication

![Authentication](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/8tfuho3svlbn25dqo8p3.gif)

For authentication I used [google-auth-library](https://www.npmjs.com/search?q=google-auth-library) which was a massive pain to work with, find any information about, and use. However, once I finally had my authentication set up, I was able to add some nice handling for my protected pages. For example, I only want authenticated users, and users that have an active subscription to be able to access the course material.

`chapter-1.astro`:
```jsx
---
import { isLoggedIn } from '../pages/utils/auth.js';
const { authed, active } = await isLoggedIn(Astro.request);

if(!authed && !active) {
  return Astro.redirect('/');
}
---
<html>
  <!-- course content -->
</html>
```


### Subscribing

![subscribing](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/ozr81jyr7r03qyrv8lm6.gif)

For subscriptions, I used [Mollie](https://mollie.com) as a payment processor. First of all, it has to be said that Mollie's API documentation is ridiculously good. I used the [Mollie API](https://docs.mollie.com/reference/v2/payments-api/create-payment) to create a payment, and then used [Mollie webhooks](https://docs.mollie.com/guides/webhooks) to handle the payment status updates. I also used webhooks to the handle recurring payments. Their super clear documentation made implementing this a _breeze_.

#### Mollie API

Mollie ships their own Node [API client](https://www.npmjs.com/package/@mollie/api-client), but I used the API directly.

To create a subscription for a user with recurring payments I do the following:
- Get the currently logged in user from the database, and see if they already have a `mollieId`
  - If they dont have a `mollieId`, I have to create a [Mollie Customer](https://docs.mollie.com/reference/v2/customers-api/create-customer), which will give me a `mollieId` that I then save on the user from the dabase
- I then create a [Mollie Payment](https://docs.mollie.com/reference/v2/payments-api/create-payment) using the `mollieId`
- I then also create a special `ActivationToken`, and store it in my database, that will automatically expire in time. The reason is that the Mollie Payment will lead to a redirect URI, where I activate the user's subscription account. If somebody was to find out the redirect URI, they could just navigate to that url and get a free subscription. Checking to see if an `ActivationToken` exists, however, prevents this from happening.

#### Dynamic routing
This is also where I get to highlight a nice Astro SSR feature: route params. Before making the payment, I create a unique `ActivationToken`, that I use as part of my Mollie `redirectUrl`, e.g. `${import.meta.env.APP_URL}/mollie/${token}/cb`.

I can now use Astro's route params to handle this:

`/mollie/[token]/cb.js`:
```js
export async function get({token}, req) {
  const activationToken = await ActivationToken.findOne({token});

  if(!activationToken) {
    return new Response(null, {
      status: 302, 
      headers: {
        'Location': '/error?code=INVALID_ACTIVATION_TOKEN'
        }
      });
  }

  // Token is valid, we can activate the user
}
```

If the `ActivationToken` is valid, I can now activate the subscription on the user object in the database, which gives them access to the protected routes of my app, that contain the course content.

### Testing webhooks

![webhooks](https://imgur.com/DfCi2gz.png)

As a fun little aside, Mollie's server naturally isn't able to send requests to my webhook handler when I'm running my application locally. So to work around this I hacked together a little mock API page that posts messages to my webhook handler, that I can then use to mock any requests and overwrite the transaction:

`webhook-test.astro`:
```jsx
---
if(import.meta.env.ENV !== 'dev') {
  return Astro.redirect('/');
}
---
<html>
  <!-- buttons etc -->
</html>
```

And in my webhook handler:
```js
if (import.meta.env.ENV === 'dev' && body?.mock) {
  transaction = {
    ...transaction,
    ...body.mock
  }
}
```

### Unsubscribe

![unsub](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/vdmcrafgw1i5v4fymfj7.gif)

### Course content

The course content consists of two different parts: theory, and interactive exercises. For the interactive exercises, I used [Lit](https://www.npmjs.com/package/lit) and [monaco-editor](https://www.npmjs.com/package/monaco-editor). Arguably, I didnt really need Lit for this part, but I'm productive with it, so it was the easy choice.

The way I load the course content again makes nice usage of Astro SSR's dynamic routing:

`/sw/[index].astro`:
```jsx
---
const user = await isLoggedIn(Astro.request);

if(!user.authed) {
  return Astro.redirect('/');
}

if(!user.active) {
  return Astro.redirect('/sw/subscribe#register');
}

const index = parseInt(Astro.params.index);
const lesson = courseIndex[index];
const nextLesson = courseIndex[index + 1];

if (!lesson) {
  return Astro.redirect('/error?code="OUT_OF_BOUNDS')
}

// etc
---
```

I make sure the user is authenticated, and has an active subscription. And then I use the route params to dynamically load the corresponding content page: either `<Theory/>` or `<InteractiveExercise/>`. I also pass along some additional information about the current lesson, like a `title`, but also some information about the _next_ lesson.

![demo](https://imgur.com/BV6nNEy.gif)

The interactive exercises use Typescript to create an AST of the code that gets input by the user, and then I do some static analysis on the code to verify wether or not the user has completed all the tasks in the exercise:

```js
function isServiceWorkerRegisterCall(ts, node) {
  if (ts.isCallExpression(node)) {
    if (ts.isPropertyAccessExpression(node.expression)) {
      if (
        node?.expression?.expression?.expression?.getText?.() === 'navigator' && 
        node?.expression?.expression?.name?.getText?.() === 'serviceWorker') {
        if (node?.expression?.name?.getText?.() === 'register') {
          return true;
        }
      }
    }
  }
  return false;
}

export const validators = [
  {
    title: 'Register a service worker',
    validate: ({ ts, node, context }) => isServiceWorkerRegisterCall(ts, node)
  },
  {
    title: 'Register "./sw.js"',
    validate: ({ts, node}) => {
      if(isServiceWorkerRegisterCall(ts, node)) {
        if (node?.arguments?.[0]?.text === './sw.js') {
          return true;
        }
      }
      return false;
    }
  }
]
```

## Conclusion

Working with Astro SSR has a been a blast. Being mostly a frontend developer, it was nice to get out of my comfort zone a little bit and do more server-side work. As an added nice result, I found that I barely ended up using any client side JS for the most part of the site, but just HTML and CSS. Obviously the interactive editor uses some client side JS, but thats only a small part of the application. Additionally, Astro SSR was very straightforward to pick up, start using, and be productive with. Would absolutely recommend.

## Astro 1.0 Hackathon

Oh, and one more thing...

This is also my submission to the [Astro Hackathon](https://astroinc.notion.site/Astro-1-0-Hackathon-9fb3499b375e4b01b88b080fd918b184#2a419109bccc4545b10271ca5e4c7bb3)! I'll be wrapping up some things here and there, improve some styling etc, and then deploy the app to Netlify and open source the code on Github.

