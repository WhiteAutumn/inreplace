
export type InreplaceHandle = {
	restore: () => void;
};

export type InreplaceOptions = {
	/**
	 * By default the function will throw when encountering a non-configurable property in the target object.
	 * With this option set to true the function will instead leave those properties untouched.
	 */
	allowNonConfigurable?: boolean;
};

export default function inreplace<T extends object>(target: T, source: object, options?: InreplaceOptions): InreplaceHandle {
	if (!Object.isExtensible(target) || Object.isSealed(target) || Object.isFrozen(target)) {
		throw new Error('Target object must allow extensions and must not be sealed or frozen!');
	}

	const allowNonConfigurable = options?.allowNonConfigurable ?? false;

	for (const property of Object.getOwnPropertyNames(target)) {
		const descriptor = Object.getOwnPropertyDescriptor(target, property)!;

		if (descriptor.configurable === false && allowNonConfigurable === false) {
			throw new Error(`Unable to inreplace this object, the property '${property}' in the target object is not configurable!`);
		}
	}

	const clone = Object.create(null);

	const targetPrototype = Object.getPrototypeOf(target);
	Object.setPrototypeOf(target, null);

	for (const property of Object.getOwnPropertyNames(target)) {
		const descriptor = Object.getOwnPropertyDescriptor(target, property)!;

		if (descriptor.configurable) {
			Object.defineProperty(clone, property, descriptor);
			Reflect.deleteProperty(target, property);
		}
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
			inreplace(target, clone, options);
		}
	};
}
