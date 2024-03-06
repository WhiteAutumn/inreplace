import { expect } from 'chai';

import inreplace from './inreplace';

describe('The inreplace() function', () => {

	it('should add all new properties', () => {
		const target: Record<string, string> = {};
		const source = { a: 'a', b: 'b', c: 'c' };

		inreplace(target, source);

		expect(target.a).to.equal('a');
		expect(target.b).to.equal('b');
		expect(target.c).to.equal('c');
	});

	it('should remove all old properties', () => {
		const target = { a: 'a', b: 'b', c: 'c' };
		const source = {};

		inreplace(target, source);

		expect('a' in target).to.be.false;
		expect('b' in target).to.be.false;
		expect('c' in target).to.be.false;
	});

	it('should keep all common properties', () => {
		const target = { a: 'a', b: 'b', c: 'c' };
		const source = { b: 'b', c: 'c', d: 'd' };

		inreplace(target, source);

		expect(target.b).to.equal('b');
		expect(target.c).to.equal('c');
	});

	it('should support getters', () => {
		const target: Record<string, unknown> = {};
		const source = { get a() { return Math.random(); } };

		inreplace(target, source);

		const descriptor = Object.getOwnPropertyDescriptor(target, 'a');
		expect(descriptor?.get).to.not.be.undefined;

		expect(target.a).to.not.equal(target.a);
	});

	it('should support setters', () => {
		const target = { set a(value: string) {} };
		const source = { a: 'a' };

		inreplace(target, source);

		const descriptor = Object.getOwnPropertyDescriptor(target, 'a');
		expect(descriptor?.set).to.be.undefined;

		expect(target.a).to.equal('a');
	});

	it('should support symbols', () => {
		const symbolA = Symbol();
		const symbolB = Symbol();
		const symbolC = Symbol();
		const target = {
			[symbolC]: 'c'
		};
		const source = {
			[symbolA]: 'a',
			[symbolB]: 'b'
		};

		inreplace(target, source);

		expect(target[symbolA]).to.equal('a');
		expect(target[symbolB]).to.equal('b');
		expect(symbolC in target).to.be.false;
	});

	it('should support non-enumerable properties', () => {
		const target: Record<string, unknown> = { a: 'a', b: 'b' };
		const source = { c: 'c', d: 'd' };

		Object.defineProperty(target, 'b', { enumerable: false });
		Object.defineProperty(source, 'c', { enumerable: false });

		inreplace(target, source);

		expect('a' in target).to.be.false;
		expect('b' in target).to.be.false;
		expect(target.c).to.equal('c');
		expect(target.d).to.equal('d');
	});

	it('should support non-writable properties in target object', () => {
		const target: Record<string, unknown> = {};
		Object.defineProperty(target, 'a', {
			writable: false,
			configurable: true,
			value: 'a'
		});
		const source = { a: 'b' };

		inreplace(target, source);

		expect(target.a).to.equal('b');
	});

	it('should copy property attributes', () => {
		const target = {};
		const source = {};
		Object.defineProperty(source, 'a', {
			enumerable: false,
			writable: false
		});

		inreplace(target, source);

		const descriptor = Object.getOwnPropertyDescriptor(target, 'a');
		expect(descriptor?.enumerable).to.be.false;
		expect(descriptor?.writable).to.be.false;
	});

	it('should not copy configurable attribute', () => {
		const target = {};
		const source = {};
		Object.defineProperty(source, 'a', {
			configurable: false,
			value: 'a'
		});

		inreplace(target, source);

		const descriptor = Object.getOwnPropertyDescriptor(target, 'a');
		expect(descriptor?.configurable).to.be.true;
	});

	it('should switch prototype', () => {
		class ParentA {
			parentA() {
				return 'a';
			}
		}

		class ChildA extends ParentA {
			childA() {
				return 'a';
			}
		}

		class ParentB {
			parentB() {
				return 'b';
			}
		}

		class ChildB extends ParentB {
			childB() {
				return 'b';
			}
		}

		const target = <Record<string, unknown>> <unknown> new ChildA();
		const source = new ChildB();

		inreplace(target, source);

		expect(target.childA).to.be.undefined;
		expect(target.parentA).to.be.undefined;
		expect(target.childB).to.not.be.undefined;
		expect(target.parentB).to.not.be.undefined;
	});

	it('should throw if any property in target is non-configurable', () => {
		const target = {};
		Object.defineProperty(target, 'a', {
			configurable: false,
			value: 'a'
		});

		const source = {};

		expect(() => inreplace(target, source)).to.throw('Unable to inreplace this object, the property \'a\' in the target object is not configurable!');
	});

	it('should not modify target object if any property is non-configurable', () => {
		const target: Record<string, unknown> = {};
		Object.defineProperty(target, 'a', {
			configurable: true,
			value: 'a'
		});
		Object.defineProperty(target, 'b', {
			configurable: false,
			value: 'b'
		});
		Object.defineProperty(target, 'c', {
			configurable: true,
			value: 'c'
		});

		const source = {};

		expect(() => inreplace(target, source)).to.throw();

		expect(target.a).to.equal('a');
		expect(target.b).to.equal('b');
		expect(target.c).to.equal('c');
	});

	it('should retain non-configurable properties if option is passed', () => {
		const target: Record<string, unknown> = {};
		Object.defineProperty(target, 'a', {
			configurable: false,
			value: 'a'
		});

		const source = { b: 'b' };

		inreplace(target, source, { allowNonConfigurable: true });

		expect(target.a).to.equal('a');
		expect(target.b).to.equal('b');
	});

	it('should throw if target object is not extensible', () => {
		const target = {};
		Object.preventExtensions(target);
		const source = {};

		expect(() => inreplace(target, source)).to.throw('Target object must allow extensions and must not be sealed or frozen!');
	});

	it('should throw if target object is sealed', () => {
		const target = {};
		Object.seal(target);
		const source = {};

		expect(() => inreplace(target, source)).to.throw('Target object must allow extensions and must not be sealed or frozen!');
	});

	it('should throw if target object is frozen', () => {
		const target = {};
		Object.freeze(target);
		const source = {};

		expect(() => inreplace(target, source)).to.throw('Target object must allow extensions and must not be sealed or frozen!');
	});

});

describe('The inreplace restore() function', () => {

	it('should remove added properties', () => {
		const target: Record<string, string> = {};
		const source = { a: 'a', b: 'b', c: 'c' };

		const handle = inreplace(target, source);
		handle.restore();

		expect('a' in target).to.be.false;
		expect('b' in target).to.be.false;
		expect('c' in target).to.be.false;
	});

	it('should add back removed properties', () => {
		const target = { a: 'a', b: 'b', c: 'c' };
		const source = {};

		const handle = inreplace(target, source);
		handle.restore();

		expect(target.a).to.equal('a');
		expect(target.b).to.equal('b');
		expect(target.c).to.equal('c');
	});

});
