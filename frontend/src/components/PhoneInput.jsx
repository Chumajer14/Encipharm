function PhoneInput({ disabled = false, error, name = "telefono", onChange, value }) {
  const handleChange = (event) => {
    const digits = event.target.value.replace(/\D/g, "").slice(0, 8);
    onChange({
      ...event,
      target: {
        ...event.target,
        name,
        value: digits,
      },
    });
  };

  return (
    <div className="phone-field">
      <div className="phone-input">
        <span>+569</span>
        <input
          disabled={disabled}
          inputMode="numeric"
          maxLength={8}
          name={name}
          onChange={handleChange}
          pattern="\d{8}"
          placeholder="12345678"
          value={value}
        />
      </div>
      {error && <small className="field-error">{error}</small>}
    </div>
  );
}

export default PhoneInput;
