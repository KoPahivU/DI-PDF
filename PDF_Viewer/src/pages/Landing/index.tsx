import styles from "./Landing.module.scss"
import classNames from "classnames/bind"

const cx = classNames.bind(styles)

function Landing() {
    return <div className={cx('wrapper')}>
    </div>
}

export default Landing;