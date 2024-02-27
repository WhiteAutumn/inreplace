
export type InreplaceHandle = {
	restore: () => void;
};

export default function inreplace<T extends object>(target: T, source: object): InreplaceHandle {
	if (!Object.isExtensible(target) || Object.isSealed(target) || Object.isFrozen(target)) {
		throw new Error('Target object must allow extensions and must not be sealed or frozen!');
	}

	const clone = Object.create(null);

	const targetPrototype = Object.getPrototypeOf(target);
	Object.setPrototypeOf(target, null);

	for (const property of Object.getOwnPropertyNames(target)) {
		const descriptor = Object.getOwnPropertyDescriptor(target, property)!;

		if (descriptor.configurable === false) {
			throw new Error(`Unable to inreplace this object, the property '${property}' in the target object is not configurable!`);
		}

		Object.defineProperty(clone, property, {
			...descriptor,
			configurable: false
		});

		Reflect.deleteProperty(target, property);
	}

	Object.setPrototypeOf(clone, targetPrototype);

	for (const property of Object.getOwnPropertyNames(source)) {
		const descriptor = Object.getOwnPropertyDescriptor(source, property)!;
		Object.defineProperty(target, property, {
			...descriptor,
			configurable: true
		});
	}

	Object.setPrototypeOf(target, Object.getPrototypeOf(source));

	return {
		restore: () => {
			inreplace(target, clone);
		}
	};
}
