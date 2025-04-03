import PropTypes from 'prop-types';
import styles from './LoadingSpinner.module.css';

const LoadingSpinner = ({ fullPage = false }) => {
  return (
    <div className={`${styles.spinnerContainer} ${fullPage ? styles.fullPage : ''}`}>
      <div className={styles.spinner}></div>
    </div>
  );
};

LoadingSpinner.propTypes = {
  fullPage: PropTypes.bool
};

export default LoadingSpinner;
