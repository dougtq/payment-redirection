CREATE TABLE acordos (
    cid_acordo VARCHAR(255) NOT NULL PRIMARY KEY
);

CREATE TABLE parcelas (
    id_parcela INT NOT NULL PRIMARY KEY,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    valor INT NOT NULL
);

CREATE TABLE boletos (
    cid_boleto VARCHAR(255) NOT NULL PRIMARY KEY,
    linha_digitavel_boleto VARCHAR(255) NOT NULL,
    valor_pagamento_boleto INT NOT NULL
);

CREATE TABLE acordos_parcelas (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    cid_acordo VARCHAR(255) NOT NULL,
    id_parcela INT NOT NULL,
    FOREIGN KEY (cid_acordo) REFERENCES acordos(cid_acordo),
    FOREIGN KEY (id_parcela) REFERENCES parcelas(id_parcela)
);

CREATE TABLE parcelas_boletos (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    id_parcela INT NOT NULL,
    cid_boleto VARCHAR(255) NOT NULL,
    FOREIGN KEY (id_parcela) REFERENCES parcelas(id_parcela),
    FOREIGN KEY (cid_boleto) REFERENCES boletos(cid_boleto)
);