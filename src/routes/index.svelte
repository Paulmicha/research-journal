<script context="module">
	import * as homepage_masthead from '../../static/data/entities/block/homepage_masthead.json'
</script>

<script>
	import { route } from '../stores/route.js';
	import { getContext } from 'svelte';
	import { nav_menu_get_items } from '../lib/nav.js';
	import MenuMain from '../components/MenuMain.svelte';
	import DropCap from '../components/DropCap.svelte';
	import Footer from '../components/Footer.svelte';
	import Lede from '../components/content/Lede.svelte';

	// TODO Evaluate using Netflify CMS.
	import { onMount } from 'svelte';
	onMount(() => {
		if (window.netlifyIdentity) {
			window.netlifyIdentity.on("init", user => {
				if (!user) {
					window.netlifyIdentity.on("login", () => {
						document.location.href = "/admin/";
					});
				}
			});
		}
	});

	const global_data = getContext('global_data');

	route.update(existing => {
		existing.path = "";
		existing.title = global_data.site_name;
		existing.description = "Experimental research journal.";
		existing.lang = "en";
		return existing;
	});

	const masthead = homepage_masthead[$route.lang];
	let menu_main_items = nav_menu_get_items(global_data, $route, 0);
</script>

<!-- DEBUG -->
<!-- <pre>index.svelte : global_data = {JSON.stringify(global_data, null, 2)}</pre> -->
<!-- <pre>index.svelte : $route = {JSON.stringify($route, null, 2)}</pre> -->
<!-- <pre>index.svelte : menu_main_items = {JSON.stringify(menu_main_items, null, 2)}</pre> -->
<!-- <pre>index.svelte : nav_menu_get_items($route) = {JSON.stringify(nav_menu_get_items($route), null, 2)}</pre> -->
<!-- <pre>index.svelte : $route.trails = {JSON.stringify($route.trails, null, 2)}</pre> -->

<div>
	<MenuMain bind:items={menu_main_items} />
	<h1>{ masthead.title }</h1>
	<Lede text="This website is created specifically for publishing my ongoing research for the Msc Strategy and Design for the Anthropocene I'm currently doing. It contains interactive experiments and various public notes, bookmarks, and visualizations."></Lede>
	<p>(<a href="/styleguide">test styles</a>)</p>
</div>

<Footer></Footer>
