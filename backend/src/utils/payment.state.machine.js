const { PAYMENT_STATES } = require("../constants/payment.states");

const ALLOWED_TRANSITIONS = {
    [PAYMENT_STATES.PENDING]: [
        PAYMENT_STATES.PROCESSING,
        PAYMENT_STATES.FAILED,
        PAYMENT_STATES.CANCELLED
    ],
    [PAYMENT_STATES.PROCESSING]: [
        PAYMENT_STATES.CAPTURED,
        PAYMENT_STATES.FAILED,
        PAYMENT_STATES.CANCELLED
    ],
    [PAYMENT_STATES.CAPTURED]: [
        PAYMENT_STATES.REFUNDED
    ],
    [PAYMENT_STATES.REFUNDED]: [],
    [PAYMENT_STATES.FAILED]: [],
    [PAYMENT_STATES.CANCELLED]: []
};

function canTransitionPaymentState(fromState, toState) {
    return ALLOWED_TRANSITIONS[fromState]?.includes(toState) || false;
}

function assertPaymentStateTransition(fromState, toState) {
    if(!canTransitionPaymentState(fromState, toState)){
        throw new Error(`Invalid payment state transition from ${fromState} to ${toState}`);
    }
}

module.exports = {
    ALLOWED_TRANSITIONS,
    canTransitionPaymentState,
    assertPaymentStateTransition
};
