var jobManager = (function(spec, my) {
    var that = {};
    spec = spec || {};
    my = my || {};
    // Attributes //
    var job_array_name = 'jio/job_array';
    var priv = {};
    priv.id = spec.id;
    priv.interval_id = null;
    priv.interval = 200;
    priv.job_a = [];

    my.jobManager = that;
    my.jobIdHandler = jobIdHandler;

    // Methods //
    /**
     * Get the job array name in the localStorage
     * @method getJobArrayName
     * @return {string} The job array name
     */
    priv.getJobArrayName = function() {
        return job_array_name + '/' + priv.id;
    };

    /**
     * Returns the job array from the localStorage
     * @method getJobArray
     * @return {array} The job array.
     */
    priv.getJobArray = function() {
        return LocalOrCookieStorage.getItem(priv.getJobArrayName())||[];
    };

    /**
     * Does a backup of the job array in the localStorage.
     * @method copyJobArrayToLocal
     */
    priv.copyJobArrayToLocal = function() {
        var new_a = [], i;
        for (i = 0; i < priv.job_a.length; i+= 1) {
            new_a.push(priv.job_a[i].serialized());
        }
        LocalOrCookieStorage.setItem(priv.getJobArrayName(),new_a);
    };

    /**
     * Removes a job from the current job array.
     * @method removeJob
     * @param  {object} job The job object.
     */
    priv.removeJob = function(job) {
        var i, tmp_job_a = [];
        for (i = 0; i < priv.job_a.length; i+= 1) {
            if (priv.job_a[i] !== job) {
                tmp_job_a.push(priv.job_a[i]);
            }
        }
        priv.job_a = tmp_job_a;
        priv.copyJobArrayToLocal();
    };

    /**
     * Sets the job manager id.
     * @method setId
     * @param  {number} id The id.
     */
    that.setId = function(id) {
        priv.id = id;
    };

    /**
     * Starts listening to the job array, executing them regulary.
     * @method start
     */
    that.start = function() {
        var i;
        if (priv.interval_id === null) {
            priv.interval_id = setInterval (function() {
                priv.restoreOldJio();
                for (i = 0; i < priv.job_a.length; i+= 1) {
                    that.execute(priv.job_a[i]);
                }
            },priv.interval);
        }
    };

    /**
     * Stops listening to the job array.
     * @method stop
     */
    that.stop = function() {
        if (priv.interval_id !== null) {
            clearInterval(priv.interval_id);
            priv.interval_id = null;
            if (priv.job_a.length === 0) {
                LocalOrCookieStorage.deleteItem(priv.getJobArrayName());
            }
        }
    };

    /**
     * Try to restore an the inactive older jio instances.
     * It will restore the on going or initial jobs from their job array
     * and it will add them to this job array.
     * @method restoreOldJio
     */
    priv.restoreOldJio = function() {
        var i, jio_id_a;
        priv.lastrestore = priv.lastrestore || 0;
        if (priv.lastrestore > (Date.now()) - 2000) { return; }
        jio_id_a = LocalOrCookieStorage.getItem('jio/id_array')||[];
        for (i = 0; i < jio_id_a.length; i+= 1) {
            priv.restoreOldJioId(jio_id_a[i]);
        }
        priv.lastrestore = Date.now();
    };

    /**
     * Try to restore an old jio according to an id.
     * @method restoreOldJioId
     * @param  {number} id The jio id.
     */
    priv.restoreOldJioId = function(id) {
        var jio_date;
        jio_date = LocalOrCookieStorage.getItem('jio/id/'+id)||0;
        if (jio_date < Date.now() - 10000) {
            priv.restoreOldJobFromJioId(id);
            priv.removeOldJioId(id);
            priv.removeJobArrayFromJioId(id);
        }
    };

    /**
     * Try to restore all jobs from another jio according to an id.
     * @method restoreOldJobFromJioId
     * @param  {number} id The jio id.
     */
    priv.restoreOldJobFromJioId = function(id) {
        var i, jio_job_array;
        jio_job_array = LocalOrCookieStorage.getItem('jio/job_array/'+id)||[];
        for (i = 0; i < jio_job_array.length; i+= 1) {
            var command_o = command(jio_job_array[i].command, my);
            if (command_o.canBeRestored()) {
                that.addJob ( job(
                    {storage:jioNamespace.storage(jio_job_array[i].storage,my),
                     command:command_o}, my));
            }
        }
    };

    /**
     * Removes a jio instance according to an id.
     * @method removeOldJioId
     * @param  {number} id The jio id.
     */
    priv.removeOldJioId = function(id) {
        var i, jio_id_a, new_a = [];
        jio_id_a = LocalOrCookieStorage.getItem('jio/id_array')||[];
        for (i = 0; i < jio_id_a.length; i+= 1) {
            if (jio_id_a[i] !== id) {
                new_a.push(jio_id_a[i]);
            }
        }
        LocalOrCookieStorage.setItem('jio/id_array',new_a);
        LocalOrCookieStorage.deleteItem('jio/id/'+id);
    };

    /**
     * Removes a job array from a jio instance according to an id.
     * @method removeJobArrayFromJioId
     * @param  {number} id The jio id.
     */
    priv.removeJobArrayFromJioId = function(id) {
        LocalOrCookieStorage.deleteItem('jio/job_array/'+id);
    };

    /**
     * Executes a job.
     * @method execute
     * @param  {object} job The job object.
     */
    that.execute = function(job) {
        try {
            job.execute();
        } catch (e) {
            switch (e.name) {
            case 'jobNotReadyException': break; // do nothing
            case 'tooMuchTriesJobException': break; // do nothing
            default: throw e;
            }
        }
        priv.copyJobArrayToLocal();
    };

    /**
     * Checks if a job exists in the job array according to a job id.
     * @method jobIdExists
     * @param  {number} id The job id.
     * @return {boolean} true if exists, else false.
     */
    that.jobIdExists = function(id) {
        var i;
        for (i = 0; i < priv.job_a.length; i+= 1) {
            if (priv.job_a[i].getId() === id) {
                return true;
            }
        }
        return false;
    };

    /**
     * Terminate a job. It only remove it from the job array.
     * @method terminateJob
     * @param  {object} job The job object
     */
    that.terminateJob = function(job) {
        priv.removeJob(job);
    };

    /**
     * Adds a job to the current job array.
     * @method addJob
     * @param  {object} job The new job.
     */
    that.addJob = function(job) {
        var result_a = that.validateJobAccordingToJobList (priv.job_a,job);
        priv.appendJob (job,result_a);
    };

    /**
     * Generate a result array containing action string to do with the good job.
     * @method validateJobAccordingToJobList
     * @param  {array} job_a A job array.
     * @param  {object} job The new job to compare with.
     * @return {array} A result array.
     */
    that.validateJobAccordingToJobList = function(job_a,job) {
        var i, result_a = [];
        for (i = 0; i < job_a.length; i+= 1) {
            result_a.push(jobRules.validateJobAccordingToJob (job_a[i],job));
        }
        return result_a;
    };

    /**
     * It will manage the job in order to know what to do thanks to a result
     * array. The new job can be added to the job array, but it can also be
     * not accepted. It is this method which can tells jobs to wait for another
     * one, to replace one or to eliminate some while browsing.
     * @method appendJob
     * @param  {object} job The job to append.
     * @param  {array} result_a The result array.
     */
    priv.appendJob = function(job,result_a) {
        var i;
        if (priv.job_a.length !== result_a.length) {
            throw new RangeError("Array out of bound");
        }
        for (i = 0; i < result_a.length; i+= 1) {
            if (result_a[i].action === 'dont accept') {
                return;
            }
        }
        for (i = 0; i < result_a.length; i+= 1) {
            switch (result_a[i].action) {
            case 'eliminate':
                priv.removeJob(result_a[i].job);
                break;
            case 'update':
                result_a[i].job.update(job);
                priv.copyJobArrayToLocal();
                return;
            case 'wait':
                job.waitForJob(result_a[i].job);
                break;
            default: break;
            }
        }
        priv.job_a.push(job);
        priv.copyJobArrayToLocal();
    };

    return that;
}());