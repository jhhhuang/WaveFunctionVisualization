function calc_kp_k(E, U0, width, pw) {
    let a = width * pw;
    let b = width * (1 - pw);
    let k = [];
    for (i = 0; i < E.length; i++) {
        let alpha = math.sqrt(2 * E[i]);
        let beta = math.complex(0, 0);
        if (E[i] == U0) {
            k.push(null);
            continue;
        } else if (U0 > E[i]) {
            beta = math.sqrt(2 * (U0 - E[i]));
        } else if (U0 < E[i]) {
            beta = math.multiply(math.sqrt(2 * (E[i] - U0)), math.complex(0, 1));
        }

        let factor = math.divide((math.multiply(beta, beta) - alpha ** 2), math.multiply(2 * alpha, beta));
        let rhs1 = math.multiply(math.cos(alpha * a), math.cosh(math.multiply(beta, b)));
        let rhs2 = math.multiply(factor, math.sin(alpha * a), math.sinh(math.multiply(beta, b)));
        let rhs = math.add(rhs1, rhs2);
        if (math.abs(rhs) < 1) {
            ki = math.acos(rhs) / a;
            k.push(math.re(ki));
        } else {
            k.push(null);
        }
    }
    return k;
}

function kp_dispersion(U0, a, pw) {
    let energy = numeric.linspace(0.5 * U0, 2 * U0, 50000);
    let k = calc_kp_k(energy, U0, a, pw);
    let data1 = [];
    for (i = 0; i < energy.length; i++) {
        data1.push([k[i], energy[i]]);
    };

    for (i = 0; i < energy.length; i++) {
        if (k[i] != null) {
            data1.push([-k[i], energy[i]]);
        } else {
            data1.push([k[i], energy[i]]);
        }

    };
    return data1;
}
