<script>
	import { createEventDispatcher } from 'svelte';
	import Select from 'svelte-select';
	import { locationEntityStore } from '$lib/stores/ecometrics.js';
	import { getLocationLabel } from '$lib/ecometrics/location.js';

	let value;
	const dispatch = createEventDispatcher();

	/**
	 * Populates the location select options.
	 */
	const getSelectOptions = locations => {
		const selectOptions = [];
		locations.forEach(location => {
			selectOptions.push({
				label: getLocationLabel(location),
				value: location.id,
				data: location
			});
		});
		selectOptions.sort((a, b) => a.label.localeCompare(b.label));
		return selectOptions;
	};

	/**
	 * Reacts to selection being made.
	 *
	 * @param {Object} option : selected option, see getSelectOptions().
	 */
	const selectionIsMade = async option => {
		dispatch('select', { entity: option.data });

		// TODO when this is called on:select on the <Select /> instance, the reset
		// will not work immediately -> find better workaround than delaying.
		let failsafe = 20;
		while (value && failsafe > 0) {
			await new Promise(resolve => setTimeout(() => {
				value = null;
				resolve();
			}, 150));
			failsafe--;
		}
	};
</script>

<Select
	items={getSelectOptions(Object.values($locationEntityStore))}
	on:select={e => selectionIsMade(e.detail)}
	placeholder="Search and select new location..."
	bind:value={value}
/>
