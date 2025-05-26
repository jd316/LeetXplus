import cx from "classnames";

function Icon({ disabled = false, classes, children, ...rest }) {
	const getClassObject = (classes) => {
		const classObject = {};
		classes.split(' ').forEach((_class) => {
			classObject[_class] = true
		});
		return classObject;
	}

	return <span {...rest} className={cx({
		"cursor-pointer": !disabled,
		"disabled": disabled,
		...getClassObject(classes)
	})}>
		{children}
	</span>
}

export default Icon